import * as fs from 'node:fs';
import * as path from 'node:path';
import { FileInfo, RemovalResult } from './types';
import { UIManager } from './UIManager';

/**
 * Deletes a confirmed list of files/directories from disk and reports the outcome.
 */
export class TrashRemover {
    private ui: UIManager;

    constructor(ui: UIManager) {
        this.ui = ui;
    }

    /**
     * Deletes each entry in `files`. Directories are removed recursively.
     * Failures for individual entries are collected rather than aborting the whole run.
     *
     * @param files - Entries to delete.
     * @returns Counts of removed/failed entries, freed space, and the paths that failed.
     */
    async removeFiles(files: FileInfo[]): Promise<RemovalResult> {
        const result: RemovalResult = {
            removedCount: 0,
            freedSpace: 0,
            failedCount: 0,
            failedPaths: [],
        };

        for (const file of files) {
            try {
                if (file.isDirectory) {
                    this.removeDirectoryRecursive(file.path);
                } else {
                    fs.unlinkSync(file.path);
                }
                result.removedCount++;
                result.freedSpace += file.size;
            } catch (error) {
                result.failedCount++;
                result.failedPaths.push(file.path);
            }
        }

        return result;
    }

    /** Recursively deletes a directory and everything inside it. */
    private removeDirectoryRecursive(dirPath: string): void {
        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath, { withFileTypes: true });

            for (const file of files) {
                const fullPath = path.join(dirPath, file.name);

                if (file.isDirectory()) {
                    this.removeDirectoryRecursive(fullPath);
                } else {
                    fs.unlinkSync(fullPath);
                }
            }

            fs.rmdirSync(dirPath);
        }
    }

    /** Formats a byte count as a human-readable string (e.g. `"1.50 GB"`). */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /** Prints how many files were removed, how much space was freed, and any failures. */
    displayRemovalSummary(result: RemovalResult): void {
        this.ui.printSuccess(`Se han eliminado ${result.removedCount} archivo(s).`);
        this.ui.printSuccess(`Espacio liberado: ${this.formatBytes(result.freedSpace)}`);

        if (result.failedCount > 0) {
            this.ui.printError(`${result.failedCount} archivo(s) no pudieron ser eliminados.`);
            if (result.failedPaths.length > 0 && result.failedPaths.length <= 5) {
                this.ui.println('Rutas fallidas:');
                result.failedPaths.forEach((path) => {
                    this.ui.printError(`  - ${path}`);
                });
            }
        }
    }
}
