import { Snippet } from './CodeTree.js';
import CodeTree from './CodeTree.js';
import randomCode from '../util/randomCode.js';
import { SnippetType } from './CodeTree.js'; // 需要从CodeTree导出SnippetType

export class Interpreter {



    /**
     * Main interpret method that processes the entire CodeTree
     */
    interpret(codeTree: CodeTree) {
        // Iterate through each namespace in the CodeTree
        for (const namespace in codeTree.root) {
            const snippets = codeTree.root[namespace];
            // Process each snippet in the namespace
            snippets.forEach(snippet => {
                this.processSnippet(snippet);
            });
        }
    }

    /**
     * Process a single snippet by analyzing its code
     */
    private processSnippet(snippet: Snippet) {
        const lines = snippet.code.split('\n');
        
        let currentLineIndex = 0;
        let mcCodeBuffer = [];
        
        while (currentLineIndex < lines.length) {
            const line = lines[currentLineIndex].trim();
            if (line === '') {
                currentLineIndex++;
                continue;
            }
            
            if (this.isINJCode(line)) {
                // If we have accumulated MC commands, create a new MC snippet
                if (mcCodeBuffer.length > 0) {
                    // Create new INJ snippet for the INJ code and remaining code
                    const injSnippet: Snippet = {
                        id: randomCode(8),
                        filename: snippet.filename,
                        type: SnippetType.RAW,  // Will be processed further
                        code: lines.slice(currentLineIndex).join('\n'),
                        next: snippet.next
                    };
                    
                    // Update original snippet to MC type
                    snippet.type = SnippetType.MC;
                    snippet.code = mcCodeBuffer.join('\n');
                    snippet.next = injSnippet;
                    
                    // Continue processing the new snippet
                    this.processSnippet(injSnippet);
                    return;
                }
                
                // Handle INJ code block
                const result = this.processINJBlock(lines, currentLineIndex);
                
                // Create INJ snippet
                const injSnippet: Snippet = {
                    id: randomCode(8),
                    filename: snippet.filename,
                    type: SnippetType.INJ,
                    code: lines.slice(currentLineIndex, result.newIndex + 1).join('\n'),
                    next: null
                };
                
                // If there's remaining code after the INJ block
                if (result.newIndex + 1 < lines.length) {
                    const remainingSnippet: Snippet = {
                        id: randomCode(8),
                        filename: snippet.filename,
                        type: SnippetType.RAW,
                        code: lines.slice(result.newIndex + 1).join('\n'),
                        next: snippet.next
                    };
                    injSnippet.next = remainingSnippet;
                    
                    // Process remaining code
                    this.processSnippet(remainingSnippet);
                }
                
                // If this is the first snippet in the chain
                if (mcCodeBuffer.length === 0) {
                    Object.assign(snippet, injSnippet);
                }
                
                return;
                
            } else {
                mcCodeBuffer.push(line);
                currentLineIndex++;
            }
        }
        
        // If we have only MC commands and reached the end
        if (mcCodeBuffer.length > 0) {
            snippet.type = SnippetType.MC;
            snippet.code = mcCodeBuffer.join('\n');
        }
    }

    /**
     * Check if a line contains an INJ function call
     */
    private isINJCode(line: string): boolean {
        // Match pattern: functionName() or functionName(params)
        const functionPattern = /^[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*({)?$/;
        // Match if() pattern
        const ifPattern = /^if\s*\([^)]*\)\s*({)?$/;
        
        return functionPattern.test(line) || ifPattern.test(line);
    }

    /**
     * Process an INJ code block and return its boundaries
     */
    private processINJBlock(lines: string[], startIndex: number): { newIndex: number } {
        const line = lines[startIndex].trim();
        let currentIndex = startIndex;
        
        // Check if there's a code block
        if (line.endsWith('{')) {
            let braceCount = 1;
            currentIndex++;
            
            // Find matching closing brace
            while (currentIndex < lines.length && braceCount > 0) {
                const currentLine = lines[currentIndex].trim();
                
                if (currentLine.includes('{')) braceCount++;
                if (currentLine.includes('}')) braceCount--;
                
                currentIndex++;
            }
            currentIndex--; // Move back to the closing brace
        }
        
        return { newIndex: currentIndex };
    }

    /**
     * Process a regular Minecraft command
     */
    private processMinecraftCommand(line: string) {
        // Here you can add logic to handle Minecraft commands
        // For now, we'll just log them
        if (line && !line.startsWith('}')) {
            console.log('Minecraft command:', line);
        }
    }
}
