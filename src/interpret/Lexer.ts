/**
 * Token types supported by the lexer
 */
export enum TokenType {
    // Basic tokens
    LEFT_PAREN = 'LEFT_PAREN',     // (
    RIGHT_PAREN = 'RIGHT_PAREN',   // )
    LEFT_BRACE = 'LEFT_BRACE',     // {
    RIGHT_BRACE = 'RIGHT_BRACE',   // }
    HASH = 'HASH',                 // #
    AT = 'AT',                     // @
    
    // Function related
    IDENTIFIER = 'IDENTIFIER',      // 函数名或标识符
    PARAM_TEXT = 'PARAM_TEXT',      // 函数参数文本
    BLOCK_START = 'BLOCK_START',    // 代码块开始
    BLOCK_END = 'BLOCK_END',        // 代码块结束
    POST_ELEMENT = 'POST_ELEMENT',  // 后置元素（如 else, elif）
    
    // Special
    EOF = 'EOF'
}

/**
 * Represents a token in the source code
 */
export interface Token {
    type: TokenType;
    lexeme: string;
    literal: any;
    line: number;
}

/**
 * Lexical analyzer that converts source code into tokens
 */
export class Lexer {
    private source: string;
    private tokens: Token[] = [];
    private start = 0;
    private current = 0;
    private line = 1;
    private parenDepth = 0;
    private braceDepth = 0;

    /**
     * Creates a new lexer instance
     * @param source The source code to analyze
     */
    constructor(source: string) {
        this.source = source;
    }

    /**
     * Scans the source code and returns an array of tokens
     * @returns Array of tokens
     */
    scanTokens(): Token[] {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }

        this.tokens.push({
            type: TokenType.EOF,
            lexeme: '',
            literal: null,
            line: this.line
        });

        return this.tokens;
    }

    private scanToken() {
        const c = this.advance();
        switch (c) {
            case '(':
                this.addToken(TokenType.LEFT_PAREN);
                this.parenDepth++;
                break;
            case ')':
                this.addToken(TokenType.RIGHT_PAREN);
                this.parenDepth--;
                if (this.parenDepth === 0) {
                    // 参数部分结束，接下来可能是代码块或后置元素
                    this.scanPostParenContent();
                }
                break;
            case '{':
                this.addToken(TokenType.LEFT_BRACE);
                this.braceDepth++;
                break;
            case '}':
                this.addToken(TokenType.RIGHT_BRACE);
                this.braceDepth--;
                if (this.braceDepth === 0) {
                    // 代码块结束，检查是否有后置元素
                    this.scanPostBlockContent();
                }
                break;
            case '#':
                // 处理注释
                while (this.peek() !== '\n' && !this.isAtEnd()) this.advance();
                break;
            case '@':
                this.addToken(TokenType.AT);
                break;
            case ' ':
            case '\r':
            case '\t':
                // 忽略空白字符
                break;
            case '\n':
                this.line++;
                break;
            default:
                if (this.isAlpha(c)) {
                    this.identifier();
                } else if (this.parenDepth > 0) {
                    // 在括号内，收集参数文本
                    this.paramText();
                } else {
                    throw new Error(`Unexpected character at line ${this.line}`);
                }
                break;
        }
    }

    /**
     * 处理括号后的内容
     */
    private scanPostParenContent() {
        this.skipWhitespace();
        if (this.peek() === '{') {
            // 是代码块
            this.addToken(TokenType.BLOCK_START);
        }
    }

    /**
     * 处理代码块后的内容
     */
    private scanPostBlockContent() {
        this.skipWhitespace();
        if (this.isAlpha(this.peek())) {
            // 可能是后置元素（如 else, elif）
            const start = this.current;
            while (this.isAlpha(this.peek())) this.advance();
            const text = this.source.substring(start, this.current);
            if (text === 'else' || text === 'elif') {
                this.addToken(TokenType.POST_ELEMENT, text);
            }
        }
    }

    /**
     * 处理标识符
     */
    private identifier() {
        while (this.isAlphaNumeric(this.peek())) this.advance();
        const text = this.source.substring(this.start, this.current);
        this.addToken(TokenType.IDENTIFIER, text);
    }

    /**
     * 处理函数参数文本
     */
    private paramText() {
        while (this.peek() !== ')' && !this.isAtEnd()) {
            if (this.peek() === '\n') this.line++;
            this.advance();
        }
        const text = this.source.substring(this.start, this.current).trim();
        if (text) {
            this.addToken(TokenType.PARAM_TEXT, text);
        }
    }

    private skipWhitespace() {
        while (true) {
            const c = this.peek();
            switch (c) {
                case ' ':
                case '\r':
                case '\t':
                    this.advance();
                    break;
                case '\n':
                    this.line++;
                    this.advance();
                    break;
                default:
                    return;
            }
        }
    }

    private isAlpha(c: string): boolean {
        return (c >= 'a' && c <= 'z') ||
               (c >= 'A' && c <= 'Z') ||
               c === '_' ||
               c === '$';
    }

    private isAlphaNumeric(c: string): boolean {
        return this.isAlpha(c) || this.isDigit(c);
    }

    private isDigit(c: string): boolean {
        return c >= '0' && c <= '9';
    }

    private peek(): string {
        if (this.isAtEnd()) return '\0';
        return this.source.charAt(this.current);
    }

    private peekNext(): string {
        if (this.current + 1 >= this.source.length) return '\0';
        return this.source.charAt(this.current + 1);
    }

    private isAtEnd(): boolean {
        return this.current >= this.source.length;
    }

    private advance(): string {
        return this.source.charAt(this.current++);
    }

    private addToken(type: TokenType, literal: any = null) {
        const text = this.source.substring(this.start, this.current);
        this.tokens.push({
            type,
            lexeme: text,
            literal,
            line: this.line
        });
    }
}

console.log(new Lexer(`
if(score gm4 load.status matches 1) {
    
}
`).scanTokens());