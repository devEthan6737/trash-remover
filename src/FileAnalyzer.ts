import * as fs from 'fs';
import * as path from 'path';
import { FileInfo, ScanResult, ScanOptions, ScanProgressCallback } from './types';

/**
 * Walks a directory tree, collecting entries that meet the configured size
 * threshold, and provides helpers for formatting and parsing byte sizes.
 */
export class FileAnalyzer {
    /**
     * Recursively scans `dirPath`, breadth-first, collecting every file and
     * directory whose size is at least `options.minSize`. Entries that can't
     * be read (permission errors, etc.) are silently skipped.
     *
     * @param dirPath - Root directory to scan.
     * @param options - Scan configuration, including the minimum size filter.
     * @param onProgress - Optional callback invoked after each entry is processed, for live progress reporting.
     * @returns The matching files, their combined size, and the count.
     */
    async scanDirectory(
        dirPath: string,
        options: ScanOptions,
        onProgress?: ScanProgressCallback,
    ): Promise<ScanResult> {
        const files: FileInfo[] = [];
        let totalSize = 0;
        let indexed = 0;

        const queue: string[] = [dirPath];

        while (queue.length > 0) {
            const currentPath = queue.shift()!;

            try {
                const entries = fs.readdirSync(currentPath, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = path.join(currentPath, entry.name);

                    try {
                        const stats = fs.statSync(fullPath);

                        if (stats.size >= options.minSize) {
                            const fileInfo: FileInfo = {
                                path: fullPath,
                                size: stats.size,
                                isDirectory: entry.isDirectory(),
                            };

                            files.push(fileInfo);
                            totalSize += stats.size;
                        }

                        if (entry.isDirectory()) {
                            queue.push(fullPath);
                        }
                    } catch {
                        // Skip files/directories we can't access
                    }

                    indexed++;
                    onProgress?.({
                        currentPath: fullPath,
                        indexed,
                        pending: queue.length,
                    });
                }
            } catch {
                // Skip directories we can't read
            }
        }

        files.sort((a, b) => b.size - a.size);

        return {
            files,
            totalSize,
            fileCount: files.length,
        };
    }

    /** Returns only the files whose size is at least `minSize` bytes. */
    filterBySize(files: FileInfo[], minSize: number): FileInfo[] {
        return files.filter((file) => file.size >= minSize);
    }

    /** Returns a new array sorted by size, largest first. */
    sortBySize(files: FileInfo[]): FileInfo[] {
        return [...files].sort((a, b) => b.size - a.size);
    }

    /** Formats a byte count as a human-readable string (e.g. `"1.50 GB"`). */
    formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Parses a user-entered size string into a byte count.
     *
     * Accepts a plain number (assumed MB) or a number followed by `MB`/`GB`,
     * case-insensitively (e.g. `"500"`, `"500MB"`, `"2GB"`, `"1.5 GB"`).
     *
     * @param input - Raw text entered by the user.
     * @returns The size in bytes, or `null` if the input couldn't be parsed.
     */
    parseSize(input: string): number | null {
        const match = input.trim().match(/^(\d+(?:\.\d+)?)\s*(MB|GB)?$/i);

        if (!match) {
            return null;
        }

        const value = parseFloat(match[1]);
        const unit = (match[2] || 'MB').toUpperCase();
        const multiplier = unit === 'GB' ? 1024 * 1024 * 1024 : 1024 * 1024;

        return Math.round(value * multiplier);
    }
}
