import { Parser } from './Parser.js';
import { Lexer } from './Lexer.js';
import { SemanticAnalyzer } from './SemanticAnalyzer.js';

export class Compiler {
    interpret(source: string) {
        // ====================================================== //
        // ================== Lexical analysis ================== //
        // ====================================================== //
        const lexer = new Lexer(source);
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

        // Continue with code generation and other steps...
    }
}
