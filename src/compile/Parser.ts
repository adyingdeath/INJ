import { Token, TokenType } from './Lexer.js';
import { 
    ASTNode, Program, Statement, MinecraftCommand, JSCode,
    IfStatement, WhileStatement, ForStatement, Expression 
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
            // Skip EOL tokens
            while (this.match(TokenType.EOL)) {}
            
            if (this.isAtEnd()) break;
            
            const stmt = this.statement();
            if (stmt) statements.push(stmt);
        }

        return {
            type: 'Program',
            body: statements,
            start: 0,
            end: this.tokens[this.tokens.length - 1].end
        };
    }

    private statement(): Statement {
        // Skip EOL tokens
        while (this.match(TokenType.EOL)) {}

        if (this.match(TokenType.MINECRAFT_COMMAND)) {
            return this.minecraftCommand();
        }
        
        if (this.match(TokenType.JS_CODE)) {
            return this.jsCode();
        }

        if (this.match(TokenType.ACTION)) {
            const action = this.previous().lexeme;
            switch (action) {
                case 'if':
                case 'elif':
                    return this.ifStatement();
                case 'while':
                    return this.whileStatement();
                case 'for':
                    return this.forStatement();
                case 'else':
                    throw this.error(this.previous(), "Unexpected 'else' without matching 'if'");
            }
        }

        throw this.error(this.peek(), "Expected statement.");
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
        const startToken = this.previous(); // 'if' or 'elif' token
        const isElif = startToken.lexeme === 'elif';

        this.consume(TokenType.LEFT_PAREN, `Expected '(' after '${isElif ? 'elif' : 'if'}'.`);
        const condition = this.parseCondition();
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after condition.");

        // Skip EOL before '{'
        while (this.match(TokenType.EOL)) {}
        
        this.consume(TokenType.LEFT_BRACE, `Expected '{' after ${isElif ? 'elif' : 'if'} condition.`);
        const consequent = this.block();

        let alternate: Statement[] | undefined;
        
        // Skip EOL tokens before checking for 'else' or 'elif'
        while (this.match(TokenType.EOL)) {}
        
        // 检查下一个token是否是else或elif
        if (this.check(TokenType.ACTION)) {
            const nextToken = this.peek();
            if (nextToken.lexeme === 'else' || nextToken.lexeme === 'elif') {
                this.advance(); // 消费掉else或elif token
                
                if (nextToken.lexeme === 'else') {
                    // Skip EOL before '{'
                    while (this.match(TokenType.EOL)) {}
                    
                    this.consume(TokenType.LEFT_BRACE, "Expected '{' after 'else'.");
                    alternate = this.block();
                } else { // elif
                    // 直接递归处理elif，不需要额外的处理
                    alternate = [this.ifStatement()];
                }
            }
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
        const startToken = this.previous(); // 'while' token

        this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'while'.");
        const condition = this.parseCondition();
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after condition.");

        // Skip EOL before '{'
        while (this.match(TokenType.EOL)) {}
        
        this.consume(TokenType.LEFT_BRACE, "Expected '{' after while condition.");
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
        const startToken = this.previous(); // 'for' token

        this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'for'.");
        const params = this.consume(TokenType.FOR_PARAMS, "Expected for loop parameters.").lexeme;
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after for parameters.");

        // Skip EOL before '{'
        while (this.match(TokenType.EOL)) {}
        
        this.consume(TokenType.LEFT_BRACE, "Expected '{' after for parameters.");
        const body = this.block();

        return {
            type: 'ForStatement',
            params,
            body,
            start: startToken.start,
            end: this.previous().end
        };
    }

    private block(): Statement[] {
        const statements: Statement[] = [];

        // Skip initial EOL tokens
        while (this.match(TokenType.EOL)) {}

        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            const stmt = this.statement();
            if (stmt) statements.push(stmt);
            
            // Skip any trailing EOL tokens after the statement
            while (this.match(TokenType.EOL)) {}
        }

        this.consume(TokenType.RIGHT_BRACE, "Expected '}' after block.");
        return statements;
    }

    private parseCondition(): Expression {
        let minecraftComponents: string[] = [];
        let jsComponents: string[] = [];
        let logic: "AND" | "OR" | null = null;
        let lastLogic: "AND" | "OR" = "OR"; // Default to OR for single components
        let nextIsNegated = false; // Track if next component should be negated

        while (!this.check(TokenType.RIGHT_PAREN) && !this.isAtEnd()) {
            const token = this.advance();
            
            switch (token.type) {
                case TokenType.MINECRAFT_LOGIC:
                    // Add the component with proper negation and quotes
                    minecraftComponents.push(
                        (nextIsNegated ? '!' : '') + token.lexeme
                    );
                    nextIsNegated = false;
                    break;
                case TokenType.JS_LOGIC:
                    // Add the component with proper negation
                    jsComponents.push(
                        (nextIsNegated ? '!(' : '') + 
                        token.lexeme + 
                        (nextIsNegated ? ')' : '')
                    );
                    nextIsNegated = false;
                    break;
                case TokenType.AND:
                    if (minecraftComponents.length > 0 || jsComponents.length > 0) {
                        logic = "AND";
                        lastLogic = "AND";
                    }
                    break;
                case TokenType.OR:
                    if (minecraftComponents.length > 0 || jsComponents.length > 0) {
                        logic = "OR";
                        lastLogic = "OR";
                    }
                    break;
                case TokenType.NOT:
                    nextIsNegated = true;
                    break;
            }
        }

        // Process the components
        const minecraft = minecraftComponents.length > 0 
            ? minecraftComponents.join(lastLogic === "AND" ? ' && ' : ' || ')
            : '';
            
        const js = jsComponents.length > 0
            ? jsComponents.join(lastLogic === "AND" ? ' && ' : ' || ')
            : '';

        // If only one type of logic exists, set logic to null
        if (!minecraft || !js) {
            logic = null;
        }

        return {
            type: 'Expression',
            minecraft,
            js,
            logic
        };
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

    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    private consume(type: TokenType, message: string): Token {
        if (this.check(type)) return this.advance();
        throw this.error(this.peek(), message);
    }

    private error(token: Token, message: string): Error {
        return new Error(`Error at line ${token.line}: ${message}`);
    }
}
