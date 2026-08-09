import { UIManager } from './UIManager';
import { ConfirmationManager } from './ConfirmationManager';
import { DiskScanner } from './DiskScanner';
import { FileAnalyzer } from './FileAnalyzer';
import { TrashRemover } from './TrashRemover';
import { WebSearchLauncher } from './WebSearchLauncher';
import { FileReviewer } from './FileReviewer';
import { FileInfo, ScanOptions } from './types';

/**
 * Orchestrates the full trash-removal flow: warn the user, pick a drive,
 * scan it, review the results file by file, and delete only what was
 * confirmed. Wires together all the other classes; contains no direct
 * filesystem or terminal logic of its own.
 */
export class App {
    private ui: UIManager;
    private confirmationManager: ConfirmationManager;
    private diskScanner: DiskScanner;
    private fileAnalyzer: FileAnalyzer;
    private trashRemover: TrashRemover;
    private webSearchLauncher: WebSearchLauncher;
    private fileReviewer: FileReviewer;

    constructor() {
        this.ui = new UIManager();
        this.confirmationManager = new ConfirmationManager(this.ui);
        this.diskScanner = new DiskScanner();
        this.fileAnalyzer = new FileAnalyzer();
        this.trashRemover = new TrashRemover(this.ui);
        this.webSearchLauncher = new WebSearchLauncher();
        this.fileReviewer = new FileReviewer(this.ui, this.webSearchLauncher, this.fileAnalyzer);
    }

    /** Runs the application end to end, from the initial warning to the final deletion summary. */
    async run(): Promise<void> {
        try {
            this.ui.printTitle('TRASH REMOVER');
            this.ui.printLabel('by ether');
            this.ui.println('');
            this.ui.println('');

            this.confirmationManager.showInitialWarning();
            const understood = await this.confirmationManager.confirmActionRequired();

            if (!understood) return this.ui.printError('Operación cancelada por el usuario.');

            this.ui.println('');

            const selectedDrive = await this.selectDrive();
            if (!selectedDrive) return this.ui.printError('No se pudo seleccionar un disco.');

            this.ui.println('');
            const minSize = await this.selectMinSize();

            const scanOptions: ScanOptions = {
                minSize,
                mode: 'by-size',
            };

            this.ui.println('');
            const scanResult = await this.fileAnalyzer.scanDirectory(selectedDrive, scanOptions, (progress) => {
                this.ui.printScanProgress(progress.currentPath, progress.indexed, progress.pending);
            });
            this.ui.clearStatusLine();
            this.ui.clear();

            if (scanResult.fileCount === 0) {
                this.ui.printWarning('No se encontraron archivos que cumplan con los criterios.');
                return;
            }

            this.ui.printInfo(`Se encontraron ${scanResult.fileCount} archivo(s).`);
            this.ui.printInfo(`Tamaño total: ${this.fileAnalyzer.formatBytes(scanResult.totalSize)}`);

            this.ui.println('');
            this.displayScanResults(scanResult.files);

            const markedFiles = await this.fileReviewer.review(scanResult.files);

            if (markedFiles.length === 0) {
                this.ui.println('');
                this.ui.printWarning('No se marcó ningún fichero para eliminar.');
                return;
            }

            const markedSize = markedFiles.reduce((sum, file) => sum + file.size, 0);

            this.ui.println('');
            const shouldDelete = await this.confirmationManager.confirmDeletion(markedFiles.length, markedSize);

            if (!shouldDelete) {
                this.ui.printWarning('Operación cancelada por el usuario.');
                return;
            }

            this.ui.println('');
            await this.ui.loading('Eliminando archivos', async () => {
                const removalResult = await this.trashRemover.removeFiles(markedFiles);
                this.ui.println('');
                this.trashRemover.displayRemovalSummary(removalResult);
            });

            this.ui.println('');
            this.ui.printSuccess('Proceso completado.');
        } catch (error) {
            this.ui.printError(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Detects available drives and lets the user pick one to scan.
     *
     * @returns The selected drive path, or `null` if no drive is accessible.
     */
    private async selectDrive(): Promise<string | null> {
        await this.diskScanner.detectDrives();
        const accessibleDrives = this.diskScanner.getAccessibleDrives();

        if (accessibleDrives.length === 0) {
            this.ui.printError('No se encontraron discos accesibles.');
            return null;
        }

        const choices = accessibleDrives.map((drive) => ({ title: drive, value: drive }));
        return this.ui.selectOption('Selecciona un disco para escanear:', choices);
    }

    /**
     * Asks the user for the minimum file size to include in the scan.
     *
     * @returns The minimum size in bytes; defaults to 10 MB if the input can't be parsed.
     */
    private async selectMinSize(): Promise<number> {
        const sizeStr = await this.ui.singleLineInput('Tamaño mínimo para incluir archivos (ej: 500MB, 2GB):');
        const parsedSize = this.fileAnalyzer.parseSize(sizeStr);

        if (parsedSize === null) {
            this.ui.printWarning('Tamaño inválido. Se usará 10 MB como predeterminado.');
            return 10 * 1024 * 1024;
        }

        return parsedSize;
    }

    /** Prints a table with the 10 largest files found by the scan. */
    private displayScanResults(files: FileInfo[]): void {
        const topFiles = files.slice(0, 10);

        const headers = ['Nombre', 'Tamaño'];
        const rows = topFiles.map((file) => [
            file.path.split('\\').pop() || file.path,
            this.fileAnalyzer.formatBytes(file.size),
        ]);

        this.ui.println('Top 10 archivos más grandes:');
        this.ui.printTable(headers, rows);
    }
}
