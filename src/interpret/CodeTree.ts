import randomCode from "../util/randomCode.js";
import fs from "fs";

enum SnippetType {
    RAW,
    MC,
    INJ,
}

export interface Snippet {
    id: string;
    filename: string;
    type: SnippetType;
    code: string;
}

export default class CodeTree {
    private snippet: Snippet[];

    constructor(filename: string, code: string) {
        this.snippet = [{
            id: randomCode(8),
            filename: filename,
            type: SnippetType.RAW,
            code: code
        }];
        // Cut the code
        this.cut();
    }

    /**
     * Cut the original code snippet into multiple parts based on "="
     * Each block of code surrounded by "=" will be of type INJ,
     * while other code will be of type MC.
     */
    cut() {
        const result: Snippet[] = [];
        const lines = this.snippet[0].code.split('\n');
        let currentCode = '';
        let isInInjBlock = false;

        for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine === '=') {
                // If we encounter "=", we finalize the current block
                if (currentCode) {
                    result.push({
                        id: randomCode(8),
                        filename: this.snippet[0].filename,
                        type: isInInjBlock ? SnippetType.INJ : SnippetType.MC,
                        code: currentCode.trim()
                    });
                    currentCode = ''; // Reset current code for the next block
                }
                isInInjBlock = !isInInjBlock; // Toggle the block type
            } else if (trimmedLine) {
                // Accumulate lines that are not empty
                currentCode += line + '\n';
            }
        }

        // Push the last accumulated code if it exists
        if (currentCode) {
            result.push({
                id: randomCode(8),
                filename: this.snippet[0].filename,
                type: isInInjBlock ? SnippetType.INJ : SnippetType.MC,
                code: currentCode.trim()
            });
        }

        this.snippet = result; // Update the snippet with the new blocks
        console.log(this.snippet);
    }
}

new CodeTree("123", fs.readFileSync("./test.mcfunction").toString());