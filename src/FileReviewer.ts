import { UIManager } from './UIManager';
import { WebSearchLauncher } from './WebSearchLauncher';
import { FileAnalyzer } from './FileAnalyzer';
import { FileInfo } from './types';

/** Action the user can take for a file being reviewed. */
type ReviewAction = 'search' | 'delete' | 'skip';

/**
 * Walks the user through the scan results one file at a time, so nothing is
 * ever deleted in bulk without individual review. For each file the user can
 * search the web for information, mark it for deletion, or skip it.
 */
export class FileReviewer {
    private ui: UIManager;
    private webSearchLauncher: WebSearchLauncher;
    private fileAnalyzer: FileAnalyzer;

    constructor(ui: UIManager, webSearchLauncher: WebSearchLauncher, fileAnalyzer: FileAnalyzer) {
        this.ui = ui;
        this.webSearchLauncher = webSearchLauncher;
        this.fileAnalyzer = fileAnalyzer;
    }

    /**
     * Reviews every file in `files` one by one.
     *
     * @param files - Candidate files to review, in the order they'll be presented.
     * @returns The subset of files the user marked for deletion.
     */
    async review(files: FileInfo[]): Promise<FileInfo[]> {
        const markedForDeletion: FileInfo[] = [];

        for (let i = 0; i < files.length; i++) {
            await this.reviewFile(files[i], i + 1, files.length, markedForDeletion);
        }

        return markedForDeletion;
    }

    /**
     * Shows the review menu for a single file, looping until the user chooses
     * to delete or skip it (a web search re-shows the menu for the same file).
     *
     * @param file - The file being reviewed.
     * @param position - 1-based position of this file in the review sequence, for display only.
     * @param total - Total number of files being reviewed, for display only.
     * @param markedForDeletion - Accumulator array; the file is pushed here if the user marks it.
     */
    private async reviewFile(
        file: FileInfo,
        position: number,
        total: number,
        markedForDeletion: FileInfo[],
    ): Promise<void> {
        let reviewing = true;

        while (reviewing) {
            this.ui.println('');
            this.ui.printLabel(`Fichero ${position}/${total}`);
            this.ui.printInfo(file.path);
            this.ui.printInfo(`Tamaño: ${this.fileAnalyzer.formatBytes(file.size)}`);

            const action = await this.ui.selectOption<ReviewAction>('¿Qué deseas hacer con este fichero?', [
                { title: '🔍 Buscar en internet qué es este fichero', value: 'search' },
                { title: '🗑️  Marcar para eliminar', value: 'delete' },
                { title: '⏭️  Ignorar y ver siguiente', value: 'skip' },
            ]);

            switch (action) {
                case 'search':
                    this.ui.printInfo('Abriendo búsqueda en el navegador...');
                    await this.webSearchLauncher.searchFile(file.path);
                    break;
                case 'delete':
                    markedForDeletion.push(file);
                    this.ui.printWarning('Marcado para eliminar.');
                    reviewing = false;
                    break;
                case 'skip':
                default:
                    reviewing = false;
                    break;
            }
        }
    }
}
