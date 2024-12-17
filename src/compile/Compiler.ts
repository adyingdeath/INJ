import { Parser } from './Parser.js';
import { Lexer } from './Lexer.js';
import { SemanticAnalyzer } from './SemanticAnalyzer.js';
import { Snippet, ASTNode, NodeType, SnippetType } from './CodeTree.js';
import { MinecraftCommand, Statement, IfStatement } from './AST.js';
import ivm from 'isolated-vm';

export class Compiler {
    private current: number = 0;
    private isolate: ivm.Isolate;
    private context: ivm.Context;
    
    constructor() {
        // Create a new isolate
        this.isolate = new ivm.Isolate({ memoryLimit: 128 });
        // Create a new context
        this.context = this.isolate.createContextSync();
        
        // Add the minecraft function to the context
        const jail = this.context.global;
        
        // Create the inj object and its minecraft function in the isolated context
        const injScript = `
            const inj = {
                minecraft: function(commands) {
                    return { type: 'minecraft', commands: commands };
                },
                ifjump: function(condition, thenCommands, elseCommands) {
                    return { 
                        type: 'ifjump', 
                        condition: condition, 
                        thenCommands: thenCommands,
                        elseCommands: elseCommands 
                    };
                }
            };
        `;
        
        // Execute the script in the isolated context
        this.context.evalSync(injScript);
    }

    compile(source: Snippet) {
        // ====================================================== //
        // ================== Lexical analysis ================== //
        // ====================================================== //
        const lexer = new Lexer(source.code);
        const tokens = lexer.scanTokens();

        // ====================================================== //
        // =================== Syntax analysis ================== //
        // ====================================================== //
        const parser = new Parser(tokens);
        const ast = parser.parse();

        // ====================================================== //
        // ================== Semantic analysis ================= //
        // ====================================================== //
        const analyzer = new SemanticAnalyzer();
        const semanticErrors = analyzer.analyze(ast);

        // If there are semantic errors, throw an exception
        if (semanticErrors.length > 0) {
            throw new Error(semanticErrors.map(error => error.toString()).join('\n'));
        }

        // ====================================================== //
        // ================ Code block extraction ================ //
        // ====================================================== //
        
        // Reset current position for new compilation
        this.current = 0;
        
        if (ast.body.length === 0) return;

        // Build JavaScript code
        const jsCode = this.processBlock(ast.body);

        console.log("Generated JavaScript code:");
        console.log(jsCode);

        // Store the generated code in the source
        source.code = jsCode;
        source.type = SnippetType.JUMP;
        
        this.dispose();
    }

    private extractMinecraftBlock(statements: Statement[]): MinecraftCommand[] {
        const minecraftBlock: MinecraftCommand[] = [];
        
        while (this.current < statements.length) {
            const node = statements[this.current];
            if (node.type === "MinecraftCommand") {
                minecraftBlock.push(node as MinecraftCommand);
                this.current++;
            } else {
                break;
            }
        }
        
        return minecraftBlock;
    }

    private processBlock(statements: Statement[]): string {
        let result: string[] = [];
        
        for (const node of statements) {
            switch (node.type) {
                case "MinecraftCommand":
                    result.push(`inj.minecraft(\`${node.command}\`);`);
                    break;
                    
                case "JSCode":
                    result.push(node.code);
                    break;
                    
                case "IfStatement": {
                    const ifNode = node as IfStatement;
                    const condition = ifNode.condition;
                    const thenBlock = this.processBlock(ifNode.consequent);
                    const elseBlock = ifNode.alternate ? this.processBlock(ifNode.alternate) : '';
                    
                    if (condition.logic === "AND") {
                        if (elseBlock) {
                            result.push(`
                                if(${condition.js}){
                                    inj.ifjump("${condition.minecraft}", () => {
                                        ${thenBlock}
                                    });
                                    inj.ifjump("!${condition.minecraft}", () => {
                                        ${elseBlock}
                                    });
                                } else {
                                    ${elseBlock}
                                }
                            `);
                        } else {
                            result.push(`
                                if(${condition.js}){
                                    inj.ifjump("${condition.minecraft}", () => {
                                        ${thenBlock}
                                    });
                                }
                            `);
                        }
                    } else if (condition.logic === "OR") {
                        result.push(`
                            if(${condition.js}){
                                ${thenBlock}
                            } else {
                                inj.ifjump("${condition.minecraft}", () => {
                                    ${thenBlock}
                                }, () => {
                                    ${elseBlock}
                                });
                            }
                        `);
                    } else {
                        if (condition.minecraft) {
                            result.push(`
                                inj.ifjump("${condition.minecraft}", () => {
                                    ${thenBlock}
                                });
                            `);
                        } else if (condition.js) {
                            result.push(`
                                if(${condition.js}){
                                    ${thenBlock}
                                }${elseBlock ? ` else {
                                    ${elseBlock}
                                }` : ''}
                            `);
                        }
                    }
                    break;
                }
            }
        }
        
        return result.join('\n');
    }

    // Clean up resources when done
    dispose() {
        this.context.release();
        this.isolate.dispose();
    }
}
