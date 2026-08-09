import chalk from 'chalk';
import prompts from 'prompts';

/**
 * Wraps all terminal input/output for the application.
 *
 * Output goes through `console`/`process.stdout` styled with `chalk`; interactive
 * input (confirmations, text, menus) goes through `prompts`. Keeping this in one
 * class means the rest of the app never touches the terminal directly.
 */
export class UIManager {
    /** Tracks whether a scan status line is currently on screen, so it can be cleared before the next write. */
    private statusLineActive = false;

    /** Clears the entire terminal screen. */
    clear(): void {
        console.clear();
    }

    /** Prints a line of plain text followed by a newline. */
    println(text: string): void {
        console.log(text);
    }

    /** Writes text without a trailing newline. */
    print(text: string): void {
        process.stdout.write(text);
    }

    /** Clears the screen and prints a bold cyan title. */
    printTitle(title: string): void {
        console.clear();
        console.log(chalk.cyan.bold(title));
    }

    /** Prints a yellow warning message. */
    printWarning(text: string): void {
        console.log(chalk.yellow(`⚠️  ${text}`));
    }

    /** Prints a red error message. */
    printError(text: string): void {
        console.log(chalk.red(`❌ ${text}`));
    }

    /** Prints a green success message. */
    printSuccess(text: string): void {
        console.log(chalk.green(`✓ ${text}`));
    }

    /** Prints a blue informational message. */
    printInfo(text: string): void {
        console.log(chalk.blue(`ℹ️  ${text}`));
    }

    /** Prints a dim, italic, gray label — used for secondary/decorative text. */
    printLabel(text: string): void {
        console.log(chalk.gray.italic(text));
    }

    /**
     * Asks the user a yes/no question.
     *
     * @param message - The question to display.
     * @returns `true` if the user confirmed, `false` otherwise (including if they cancelled).
     */
    async yesOrNo(message: string): Promise<boolean> {
        const response = await prompts({
            type: 'confirm',
            name: 'value',
            message,
            initial: false,
        });

        return !!response.value;
    }

    /**
     * Prompts the user for a single line of free text.
     *
     * @param message - The prompt to display.
     * @returns The entered text, or an empty string if the prompt was cancelled.
     */
    async singleLineInput(message: string): Promise<string> {
        const response = await prompts({
            type: 'text',
            name: 'value',
            message,
        });

        return response.value ?? '';
    }

    /**
     * Presents a single-select menu and returns the value of the chosen option.
     *
     * @param message - The prompt to display above the menu.
     * @param choices - Options to choose from, each with a display title and an underlying value.
     * @returns The `value` of the selected choice.
     */
    async selectOption<T extends string>(message: string, choices: { title: string; value: T }[]): Promise<T> {
        const response = await prompts({
            type: 'select',
            name: 'value',
            message,
            choices,
        });

        return response.value;
    }

    /**
     * Prints a simple fixed-width table to the terminal.
     *
     * @param headers - Column headers.
     * @param rows - Row data; each row must have the same length as `headers`.
     */
    printTable(headers: string[], rows: (string | number)[][]): void {
        const columnWidths = headers.map((header) => Math.max(header.length, 20));

        console.log(chalk.cyan(headers.map((header, i) => header.padEnd(columnWidths[i])).join(' | ')));
        console.log('-'.repeat(columnWidths.reduce((a, b) => a + b + 3, 0)));

        rows.forEach((row) => {
            console.log(row.map((cell, i) => String(cell).padEnd(columnWidths[i])).join(' | '));
        });
    }

    /**
     * Prints a "loading" message and awaits a callback that performs the actual work.
     *
     * @param message - Description of the operation being performed.
     * @param callback - The async operation to run.
     */
    async loading(message: string, callback: () => Promise<void>): Promise<void> {
        this.println(`⏳ ${message}...`);
        await callback();
    }

    /**
     * Renders one line of live scan output: the file currently being read (in gray),
     * followed by a sticky status line showing indexed/pending counts and an estimated
     * percentage. The status line is redrawn in place on every call via {@link clearStatusLine}.
     *
     * @param currentPath - Path of the entry just processed.
     * @param indexed - Number of entries processed so far.
     * @param pending - Number of directories still queued for traversal.
     */
    printScanProgress(currentPath: string, indexed: number, pending: number): void {
        this.clearStatusLine();

        console.log(chalk.gray(currentPath));

        const total = indexed + pending;
        const percentage = total > 0 ? Math.min(100, Math.round((indexed / total) * 100)) : 0;
        const statusText = `[${indexed} indexados] · [${pending} por indexar] · [${percentage}%]`;
        const width = process.stdout.columns || 80;

        process.stdout.write(chalk.cyan(statusText.slice(0, width)));
        this.statusLineActive = true;
    }

    /** Erases the current scan status line, if one is visible, using raw ANSI codes. */
    clearStatusLine(): void {
        if (this.statusLineActive) {
            process.stdout.write('\r\x1b[K');
            this.statusLineActive = false;
        }
    }
}
