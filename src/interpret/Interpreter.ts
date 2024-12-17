import { Parser } from './Parser.js';
import { Lexer } from './Lexer.js';
import { SemanticAnalyzer } from './SemanticAnalyzer.js';

export class Interpreter {
    interpret(source: string) {
        // 词法分析
        const lexer = new Lexer(source);
        const tokens = lexer.scanTokens();

        // 语法分析
        const parser = new Parser(tokens);
        const ast = parser.parse();

        // 语义分析
        const analyzer = new SemanticAnalyzer();
        const semanticErrors = analyzer.analyze(ast);

        // 如果有语义错误，抛出异常
        if (semanticErrors.length > 0) {
            throw new Error(semanticErrors.map(error => error.toString()).join('\n'));
        }

        // 继续后续的代码生成等步骤...
    }
}
