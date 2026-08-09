import { UIManager } from './UIManager';

/**
 * Centralizes every user confirmation the app requires before taking action.
 *
 * The same confirmation question is always used, so the user only ever needs
 * to learn one prompt.
 */
export class ConfirmationManager {
    private ui: UIManager;

    constructor(ui: UIManager) {
        this.ui = ui;
    }

    /** Prints the initial warning shown before the app does anything else. */
    showInitialWarning(): void {
        this.ui.printWarning('IMPORTANTE: Esta aplicación eliminará archivos permanentemente.');
        this.ui.printLabel('Se te pedirá confirmación ANTES de ejecutar cualquier acción.');
        this.ui.println('');
    }

    /**
     * Confirms that the user understood the initial warning and wants to proceed.
     *
     * @returns `true` if the user confirmed.
     */
    async confirmActionRequired(): Promise<boolean> {
        return this.requestConfirmation();
    }

    /**
     * Confirms the final deletion of the files the user marked for removal.
     *
     * @param fileCount - Number of files that will be deleted.
     * @param totalSize - Combined size, in bytes, of the files that will be deleted.
     * @returns `true` if the user confirmed the deletion.
     */
    async confirmDeletion(fileCount: number, totalSize: number): Promise<boolean> {
        this.ui.println('');
        this.ui.printWarning(`Se van a eliminar ${fileCount} archivo(s) y se liberarán ${this.formatBytes(totalSize)}.`);
        return this.requestConfirmation();
    }

    /** Displays the single, consistent confirmation question used throughout the app. */
    private async requestConfirmation(): Promise<boolean> {
        return this.ui.yesOrNo('¿Confirmas esta acción?');
    }

    /** Formats a byte count as a human-readable string (e.g. `"1.50 GB"`). */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
