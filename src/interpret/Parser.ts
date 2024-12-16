import { Token, TokenType } from './Lexer.js';
import { 
    ASTNode, Program, Statement, MinecraftCommand, 
    JSCode, IfStatement, WhileStatement, ForStatement,
    Expression
} from './AST.js';

export class Parser {
    private tokens: Token[] = [];
    private current = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    parse(): Program {
        const statements: Statement[] = [];
        
        while (!this.isAtEnd()) {
            try {
                const stmt = this.statement();
                if (stmt) statements.push(stmt);
            } catch (error) {
                console.error(`Parse error at line ${this.peek().line}: ${error}`);
                // 错误恢复：跳过当前语句直到遇到下一个语句的开始
                this.synchronize();
            }
        }

        return {
            type: 'Program',
            body: statements,
            start: 0,
            end: this.tokens[this.tokens.length - 1].end
        };
    }

    private statement(): Statement | null {
        // 跳过EOL
        while (this.match(TokenType.EOL)) {}
        
        if (this.isAtEnd()) return null;

        // 检查语句类型
        if (this.match(TokenType.MINECRAFT_COMMAND)) {
            return this.minecraftCommand();
        }
        if (this.match(TokenType.JS_CODE)) {
            return this.jsCode();
        }
        if (this.check(TokenType.ACTION)) {
            const action = this.advance().lexeme;
            switch (action) {
                case 'if':
                    return this.ifStatement();
                case 'while':
                    return this.whileStatement();
                case 'for':
                    return this.forStatement();
            }
        }

        throw new Error(`Unexpected token: ${this.peek().lexeme}`);
    }

    private minecraftCommand(): MinecraftCommand {
        const token = this.previous();
        return {
            type: 'MinecraftCommand',
            command: token.lexeme,
            start: token.start,
            end: token.end
        };
    }

    private jsCode(): JSCode {
        const token = this.previous();
        return {
            type: 'JSCode',
            code: token.lexeme,
            start: token.start,
            end: token.end
        };
    }

    private ifStatement(): IfStatement {
        const startToken = this.previous();
        
        // 解析条件
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'");
        const condition = this.parseCondition();
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition");

        // 解析主体
        this.consume(TokenType.LEFT_BRACE, "Expect '{' before if body");
        const consequent = this.block();

        // 解析可选的else分支
        let alternate: Statement[] | undefined;
        if (this.match(TokenType.ACTION) && this.previous().lexeme === 'else') {
            this.consume(TokenType.LEFT_BRACE, "Expect '{' before else body");
            alternate = this.block();
        }

        return {
            type: 'IfStatement',
            condition,
            consequent,
            alternate,
            start: startToken.start,
            end: this.previous().end
        };
    }

    private whileStatement(): WhileStatement {
        const startToken = this.previous();

        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'");
        const condition = this.parseCondition();
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition");

        this.consume(TokenType.LEFT_BRACE, "Expect '{' before while body");
        const body = this.block();

        return {
            type: 'WhileStatement',
            condition,
            body,
            start: startToken.start,
            end: this.previous().end
        };
    }

    private forStatement(): ForStatement {
        const startToken = this.previous();

        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'");
        const params = this.consume(TokenType.FOR_PARAMS, "Expect for loop parameters").lexeme;
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for parameters");

        this.consume(TokenType.LEFT_BRACE, "Expect '{' before for body");
        const body = this.block();

        return {
            type: 'ForStatement',
            params,
            body,
            start: startToken.start,
            end: this.previous().end
        };
    }

    private parseCondition(): Expression {
        let minecraft = '';
        let js = '';

        while (!this.check(TokenType.RIGHT_PAREN) && !this.isAtEnd()) {
            const token = this.advance();
            
            switch (token.type) {
                case TokenType.MINECRAFT_LOGIC:
                    minecraft = token.lexeme;
                    break;
                case TokenType.JS_LOGIC:
                    js = token.lexeme;
                    break;
                case TokenType.AND:
                case TokenType.OR:
                case TokenType.NOT:
                    // 逻��运算符作为js条件的一部分
                    js += token.lexeme === '&&' ? ' && ' : 
                         token.lexeme === '||' ? ' || ' : '!';
                    break;
            }
        }

        return {
            type: 'Expression',
            minecraft,
            js
        };
    }

    private block(): Statement[] {
        const statements: Statement[] = [];

        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            const stmt = this.statement();
            if (stmt) statements.push(stmt);
        }

        this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block");
        return statements;
    }

    private synchronize() {
        this.advance();

        while (!this.isAtEnd()) {
            if (this.previous().type === TokenType.EOL) return;

            switch (this.peek().type) {
                case TokenType.ACTION:
                    return;
            }

            this.advance();
        }
    }

    private match(...types: TokenType[]): boolean {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    private check(type: TokenType): boolean {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    private advance(): Token {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    private consume(type: TokenType, message: string): Token {
        if (this.check(type)) return this.advance();
        throw new Error(message);
    }

    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }
}
