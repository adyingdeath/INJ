export enum TokenType {
    MINECRAFT_COMMAND, // For pure minecraft commands
    JS_CODE,          // For JavaScript-like code ending with semicolon
    ACTION,           // For action names like 'if', 'while'
    LEFT_PAREN,       // (
    RIGHT_PAREN,      // )
    LEFT_BRACE,       // {
    RIGHT_BRACE,      // }
    STRING,           // For string literals
    AND,              // &
    OR,               // |
    NOT,              // !
    FOR_PARAMS,       // Special token for for loop parameters
    MINECRAFT_LOGIC,   // For minecraft logic conditions
    JS_LOGIC,         // For JavaScript logic conditions
    EOL,              // End of line
    EOF               // End of file
}

export interface Token {
    type: TokenType;
    lexeme: string;
    line: number;
    start: number;
    end: number;
}

export class Lexer {
    private source: string;
    private tokens: Token[] = [];
    private start = 0;
    private current = 0;
    private line = 1;

    constructor(source: string) {
        this.source = source;
    }

    scanTokens(): Token[] {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }

        this.tokens.push({
            type: TokenType.EOF,
            lexeme: "",
            line: this.line,
            start: this.current,
            end: this.current
        });

        return this.tokens;
    }

    private scanToken() {
        // Skip whitespace
        while (this.isWhitespace(this.peek())) {
            this.advance();
        }
        this.start = this.current;

        // Handle newlines
        if (this.peek() === '\n') {
            this.line++;
            this.advance();
            this.addToken(TokenType.EOL);
            return;
        }

        // First check for special characters and operators
        const c = this.peek();
        switch (c) {
            case '(':
                this.advance();
                this.addToken(TokenType.LEFT_PAREN);
                return;
            case ')':
                this.advance();
                this.addToken(TokenType.RIGHT_PAREN);
                return;
            case '{':
                this.advance();
                this.addToken(TokenType.LEFT_BRACE);
                return;
            case '}':
                this.advance();
                this.addToken(TokenType.RIGHT_BRACE);
                return;
            case '"':
            case "'":
            case '`':
                this.advance();
                this.scanString();
                return;
        }

        // If we're at the start of a line
        if (this.isStartOfLine()) {
            // Check for JS code (ends with semicolon)
            if (this.hasJSCodePattern()) {
                this.scanJSCode();
                return;
            }
            // Check for action pattern
            if (!this.isActionPattern()) {
                this.scanMinecraftCommand();
                return;
            }
        }

        // Handle other tokens
        this.advance();
        if (this.isAlpha(c)) {
            this.scanAction();
        } else {
            throw new Error(`Unexpected character '${c}' at line ${this.line}`);
        }
    }

    private scanString() {
        const quoteChar = this.source.charAt(this.current - 1); // Get the opening quote type

        // Read until we find the matching quote
        while (!this.isAtEnd() && this.peek() !== quoteChar) {
            if (this.peek() === '\n') this.line++;
            this.advance();
        }

        if (this.isAtEnd()) {
            // Handle unterminated string error
            throw new Error(`Unterminated string at line ${this.line}`);
        }

        // Consume the closing quote
        this.advance();

        // Get the string value (including quotes)
        this.addToken(TokenType.STRING);
    }

    private isActionPattern(): boolean {
        let pos = this.current;
        let foundAction = false;
        let actionStart = pos;
        
        while (pos < this.source.length) {
            const c = this.source.charAt(pos);
            
            if (c === '\n') {
                break;
            }
            
            if (!foundAction && this.isAlpha(c)) {
                foundAction = true;
                actionStart = pos;
            } else if (foundAction) {
                // Check for all three patterns:
                // 1. action(...)
                // 2. action{...}
                // 3. action()
                if (c === '(' || c === '{') {
                    // 检查是否是特殊action（if, elif, while, for）
                    const actionName = this.source.substring(actionStart, pos).trim();
                    if (actionName === 'if' || actionName === 'elif' || 
                        actionName === 'while' || actionName === 'for') {
                        return true;
                    }
                    return true;
                } else if (!this.isWhitespace(c) && !this.isAlphaNumeric(c)) {
                    return false;
                }
            }
            
            pos++;
        }
        
        return false;
    }

    private isWhitespace(c: string): boolean {
        return c === ' ' || c === '\t';
    }

    private scanMinecraftCommand() {
        // Read the entire line as a Minecraft command
        let command = '';
        while (!this.isAtEnd()) {
            const c = this.peek();
            if (c === '\n') break;
            command += this.advance();
        }
        
        // Trim any trailing whitespace but keep the command intact
        this.addToken(TokenType.MINECRAFT_COMMAND);
    }

    private scanAction() {
        while (this.isAlphaNumeric(this.peek())) {
            this.advance();
        }
        
        const actionName = this.source.substring(this.start, this.current);
        this.addToken(TokenType.ACTION);
        
        // Handle different action types
        switch (actionName) {
            case 'for':
                this.scanForParams();
                break;
            case 'if':
            case 'elif':  // 确保elif和if使用相同的处理逻辑
            case 'while':
                this.scanLogicParams();
                break;
        }
    }

    private scanForParams() {
        // Skip whitespace
        while (this.peek() === ' ' || this.peek() === '\t') {
            this.advance();
        }
        
        // Make sure we're at a left parenthesis
        if (this.peek() !== '(') {
            return;
        }
        
        // Add left parenthesis as a token
        this.start = this.current;
        this.advance();
        this.addToken(TokenType.LEFT_PAREN);
        
        this.start = this.current;
        let parenCount = 1;
        
        // Read until matching closing parenthesis
        while (!this.isAtEnd() && parenCount > 0) {
            const c = this.peek();
            if (c === '(') parenCount++;
            if (c === ')') parenCount--;
            
            if (parenCount > 0) {
                this.advance();
            }
        }
        
        // Add the FOR_PARAMS token
        this.addToken(TokenType.FOR_PARAMS);
        
        if (!this.isAtEnd()) {
            // Add right parenthesis as a token
            this.start = this.current;
            this.advance();
            this.addToken(TokenType.RIGHT_PAREN);
        }
    }

    private scanLogicParams() {
        // Skip whitespace
        while (this.peek() === ' ' || this.peek() === '\t') {
            this.advance();
        }
        
        // Make sure we're at a left parenthesis
        if (this.peek() !== '(') {
            return;
        }
        
        // Add left parenthesis as a token
        this.start = this.current;
        this.advance();
        this.addToken(TokenType.LEFT_PAREN);
        
        // Scan logic expressions
        while (!this.isAtEnd() && this.peek() !== ')') {
            this.scanLogicExpression();
        }
        
        if (!this.isAtEnd()) {
            // Add right parenthesis as a token
            this.start = this.current;
            this.advance();
            this.addToken(TokenType.RIGHT_PAREN);
        }
    }

    private scanLogicExpression() {
        // Skip whitespace
        while (this.isWhitespace(this.peek())) {
            this.advance();
        }
        
        // Handle NOT operator
        if (this.peek() === '!') {
            this.advance();
            this.addToken(TokenType.NOT);
            // Skip whitespace after NOT
            while (this.isWhitespace(this.peek())) {
                this.advance();
            }
        }
        
        this.start = this.current;
        
        // Analyze the complete logic variable
        this.scanLogicVariable();
        
        // Skip whitespace
        while (this.isWhitespace(this.peek())) {
            this.advance();
        }
        
        // Check for logical operators
        if ((this.peek() === '&' && this.peekNext() === '&') || 
            (this.peek() === '|' && this.peekNext() === '|')) {
            const op = this.peek();
            this.start = this.current;  // Start from the first & or |
            this.advance();  // Consume first & or |
            this.advance();  // Consume second & or |
            this.addToken(op === '&' ? TokenType.AND : TokenType.OR);
        }
    }

    private scanLogicVariable() {
        let parenCount = 0;
        let isString = false;
        let stringChar = '';
        let content = '';
        this.start = this.current;
        
        while (!this.isAtEnd()) {
            const c = this.peek();
            
            // Handle string literals
            if ((c === '"' || c === "'" || c === '`') && !isString) {
                isString = true;
                stringChar = c;
                content += this.advance();
                continue;
            }
            
            if (isString) {
                content += this.advance();
                if (c === '\\') {
                    if (!this.isAtEnd()) {
                        content += this.advance(); // Include escaped character
                    }
                    continue;
                }
                if (c === stringChar) {
                    isString = false;
                    continue;
                }
            } else {
                if (c === '(') {
                    parenCount++;
                } else if (c === ')') {
                    if (parenCount === 0) break;
                    parenCount--;
                } else if (parenCount === 0 && 
                          ((c === '&' && this.peekNext() === '&') || 
                           (c === '|' && this.peekNext() === '|'))) {
                    break;
                }
                content += this.advance();
            }
        }
        
        // Trim whitespace
        content = content.trim();
        
        // Determine if this is a MINECRAFT_LOGIC or JS_LOGIC
        const isMinecraftLogic = this.isMinecraftLogicContent(content);
        
        this.tokens.push({
            type: isMinecraftLogic ? TokenType.MINECRAFT_LOGIC : TokenType.JS_LOGIC,
            lexeme: isMinecraftLogic ? content.slice(1, -1) : content,
            line: this.line,
            start: this.start,
            end: this.current
        });
    }

    private isMinecraftLogicContent(content: string): boolean {
        // Check if the content is a pure string literal
        const trimmed = content.trim();
        if (trimmed.length < 2) return false;
        
        const firstChar = trimmed[0];
        const lastChar = trimmed[trimmed.length - 1];
        
        // Check if it's wrapped in matching quotes
        if ((firstChar === '"' && lastChar === '"') ||
            (firstChar === "'" && lastChar === "'") ||
            (firstChar === '`' && lastChar === '`')) {
            
            // Check if there's any non-string content
            const inner = trimmed.slice(1, -1);
            // Make sure there are no unescaped quotes of the same type
            const quoteCount = (inner.match(new RegExp(`[^\\\\]${firstChar}`, 'g')) || []).length;
            return quoteCount === 0;
        }
        
        return false;
    }

    private isStartOfLine(): boolean {
        let pos = this.current - 1;
        while (pos >= 0) {
            const c = this.source.charAt(pos);
            if (c === '\n') return true;
            if (c !== ' ' && c !== '\t') return false;
            pos--;
        }
        return true;
    }

    private peekWord(): string {
        let pos = this.current;
        while (pos < this.source.length && this.isAlphaNumeric(this.source.charAt(pos))) {
            pos++;
        }
        return this.source.substring(this.current - 1, pos);
    }

    private isAlphaNumeric(c: string): boolean {
        return this.isAlpha(c) || this.isDigit(c);
    }

    private isAlpha(c: string): boolean {
        return (c >= 'a' && c <= 'z') ||
               (c >= 'A' && c <= 'Z') ||
               c === '_' || c === ':';
    }

    private isDigit(c: string): boolean {
        return c >= '0' && c <= '9';
    }

    private advance(): string {
        return this.source.charAt(this.current++);
    }

    private peek(): string {
        if (this.isAtEnd()) return '\0';
        return this.source.charAt(this.current);
    }

    private isAtEnd(): boolean {
        return this.current >= this.source.length;
    }

    private addToken(type: TokenType) {
        const text = this.source.substring(this.start, this.current);
        this.tokens.push({
            type,
            lexeme: text,
            line: this.line,
            start: this.start,
            end: this.current
        });
    }

    private hasJSCodePattern(): boolean {
        let pos = this.current;
        
        while (pos < this.source.length) {
            const c = this.source.charAt(pos);
            if (c === '\n') return false;
            if (c === ';') return true;
            pos++;
        }
        
        return false;
    }

    private scanJSCode() {
        // Read until semicolon
        while (!this.isAtEnd()) {
            const c = this.peek();
            if (c === '\n') break;
            if (c === ';') {
                this.advance(); // consume the semicolon
                break;
            }
            this.advance();
        }
        
        this.addToken(TokenType.JS_CODE);
    }

    private peekNext(): string {
        if (this.current + 1 >= this.source.length) return '\0';
        return this.source.charAt(this.current + 1);
    }
}