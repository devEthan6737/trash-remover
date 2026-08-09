import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'os';

/**
 * Detects the drives/volumes available on the current machine, across
 * Windows, macOS and Linux, and filters them down to the ones this
 * process can actually read.
 */
export class DiskScanner {
    private drives: string[] = [];

    /**
     * Detects the available drives for the current platform and caches them.
     *
     * @returns The list of detected drive/volume paths.
     */
    async detectDrives(): Promise<string[]> {
        if (process.platform === 'win32') {
            this.drives = this.detectWindowsDrives();
        } else if (process.platform === 'darwin') {
            this.drives = this.detectMacDrives();
        } else {
            this.drives = this.detectLinuxDrives();
        }
        return this.drives;
    }

    /** Probes drive letters A: through Z: and returns the ones that exist, as root paths (e.g. `"C:\\"`). */
    private detectWindowsDrives(): string[] {
        const drives: string[] = [];
        for (let i = 65; i <= 90; i++) {
            const drive = String.fromCharCode(i) + ':\\';
            try {
                if (fs.existsSync(drive)) {
                    drives.push(drive);
                }
            } catch {
                // Drive doesn't exist
            }
        }
        return drives;
    }

    /** Lists mounted volumes under `/Volumes`, falling back to the root filesystem. */
    private detectMacDrives(): string[] {
        const drives: string[] = [];
        try {
            const volumes = fs.readdirSync('/Volumes');
            volumes.forEach((volume) => {
                drives.push(path.join('/Volumes', volume));
            });
        } catch {
            drives.push('/');
        }
        return drives;
    }

    /** Returns the root filesystem plus any mounts found under `/mnt`. */
    private detectLinuxDrives(): string[] {
        const drives: string[] = ['/'];
        try {
            const mounts = fs.readdirSync('/mnt');
            mounts.forEach((mount) => {
                drives.push(path.join('/mnt', mount));
            });
        } catch {
            // Use default root
        }
        return drives;
    }

    /**
     * Checks whether the given path can be read by this process.
     *
     * @param drivePath - Path to check.
     * @returns `true` if the path is readable.
     */
    isAccessible(drivePath: string): boolean {
        try {
            fs.accessSync(drivePath, fs.constants.R_OK);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Returns the previously detected drives, filtered to the ones that are readable.
     * Call {@link detectDrives} first.
     */
    getAccessibleDrives(): string[] {
        return this.drives.filter((drive) => this.isAccessible(drive));
    }
}
