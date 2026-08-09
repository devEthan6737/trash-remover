import { execFile } from 'node:child_process';
import * as path from 'node:path';

/**
 * Opens the system's default browser with a search query about a given file,
 * to help the user figure out what it is before deciding whether to delete it.
 */
export class WebSearchLauncher {
    /**
     * Builds an OS-aware search query for `filePath`'s file name and opens it
     * in the default browser.
     *
     * @param filePath - Path of the file the user wants information about.
     */
    async searchFile(filePath: string): Promise<void> {
        const fileName = path.basename(filePath);
        const url = this.buildSearchUrl(fileName);
        await this.openUrl(url);
    }

    /** Builds a Google search URL asking what `fileName` is for on the current OS. */
    private buildSearchUrl(fileName: string): string {
        const osName = this.getOSName();
        const query = `${fileName} archivo ${osName} para qué sirve`;
        return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }

    /** Maps `process.platform` to a human-readable OS name for the search query. */
    private getOSName(): string {
        switch (process.platform) {
            case 'win32':
                return 'Windows';
            case 'darwin':
                return 'macOS';
            default:
                return 'Linux';
        }
    }

    /** Opens `url` in the default browser and resolves once the launcher command has been issued. */
    private openUrl(url: string): Promise<void> {
        return new Promise((resolve) => {
            const [command, args] = this.getOpenCommand(url);
            execFile(command, args, () => resolve());
        });
    }

    /**
     * Returns the platform-specific command (and arguments) used to open a URL
     * in the default browser, without going through a shell.
     */
    private getOpenCommand(url: string): [string, string[]] {
        switch (process.platform) {
            case 'win32':
                return ['cmd', ['/c', 'start', '""', url]];
            case 'darwin':
                return ['open', [url]];
            default:
                return ['xdg-open', [url]];
        }
    }
}
