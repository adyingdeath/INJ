export class Transformer {
    /**
     * Transform code into valid JavaScript
     * @param code Input code (single or multiple lines)
     * @returns Transformed code
     */
    transform(code: string): string {
        // Split code into lines and process each line
        const lines = code.split('\n');
        const transformedLines = lines.map(line => this.transformLine(line));
        return transformedLines.join('\n');
    }

    /**
     * Transform a single line of code
     * @param line Single line of code
     * @returns Transformed line
     */
    private transformLine(line: string): string {
        // Trim the line to remove leading/trailing whitespace
        const trimmedLine = line.trim();
        
        // Skip empty lines
        if (!trimmedLine) {
            return line;
        }

        // Rule 1: Skip if ends with semicolon
        if (trimmedLine.endsWith(';')) {
            return line;
        }

        // Rule 2: Check if it's a single identifier
        if (this.isSingleIdentifier(trimmedLine)) {
            return this.wrapWithExecute(line);
        }

        // Rule 3: Check if it starts with "identifier space identifier"
        if (this.startsWithTwoIdentifiers(trimmedLine)) {
            return this.wrapWithExecute(line);
        }

        // If none of the rules match, return the original line
        return line;
    }

    /**
     * Check if the line is a single identifier
     */
    private isSingleIdentifier(line: string): boolean {
        // Remove all whitespace and check if it contains special characters
        const noWhitespace = line.replace(/\s/g, '');
        return /^[^(){}\[\]<>;"'\s]+$/.test(noWhitespace);
    }

    /**
     * Check if the line starts with two identifiers separated by space
     */
    private startsWithTwoIdentifiers(line: string): boolean {
        // Match pattern: identifier + space + identifier
        const pattern = /^[^(){}\[\]<>;"'\s]+\s+[^(){}\[\]<>;"'\s]+/;
        return pattern.test(line);
    }

    /**
     * Wrap a line with inj.execute()
     */
    private wrapWithExecute(line: string): string {
        // Preserve original indentation
        const indentation = line.match(/^\s*/)?.[0] || '';
        const trimmedLine = line.trim();
        return `${indentation}inj.execute(\`${trimmedLine.replace(/`/g, "\\`")}\`)`;
    }
}
