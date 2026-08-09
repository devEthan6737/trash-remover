/**
 * A single file or directory found during a disk scan.
 */
export interface FileInfo {
    path: string;
    size: number;
    isDirectory: boolean;
}

/**
 * Aggregated outcome of scanning a directory tree.
 */
export interface ScanResult {
    files: FileInfo[];
    totalSize: number;
    fileCount: number;
}

/**
 * Aggregated outcome of a deletion pass over a list of files.
 */
export interface RemovalResult {
    removedCount: number;
    freedSpace: number;
    failedCount: number;
    failedPaths: string[];
}

/**
 * Supported scanning strategies. Currently only filtering by minimum size is implemented.
 */
export type ScanMode = 'by-size';

/**
 * Options that configure how a directory scan behaves.
 */
export interface ScanOptions {
    /** Minimum size in bytes an entry must have to be included in the results. */
    minSize: number;
    mode: ScanMode;
}

/**
 * Snapshot of an in-progress scan, reported to the caller via {@link ScanProgressCallback}.
 */
export interface ScanProgress {
    /** Path of the entry that was just processed. */
    currentPath: string;
    /** Number of entries processed so far. */
    indexed: number;
    /** Number of directories still queued for traversal. */
    pending: number;
}

/**
 * Callback invoked after each entry is processed during a scan, used to render live progress.
 */
export type ScanProgressCallback = (progress: ScanProgress) => void;
