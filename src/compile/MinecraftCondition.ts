interface Expression {
    expression: string | Expression[];
    type?: 'AND' | 'OR' | 'VAR';
    positive: boolean;
}

/**
 * Represents a general logic expression with string variables
 */
export class LogicExpression implements Expression {
    public expression: string | Expression[];
    public type?: 'AND' | 'OR' | 'VAR';
    public positive: boolean;

    constructor(input: string) {
        const parsed = this.parseExpression(input);
        this.expression = parsed.expression;
        this.type = parsed.type;
        this.positive = parsed.positive;
    }

    private parseExpression(expression: string): Expression {
        // First build complete expression tree without any simplification
        const expr = this.parseExpressionOnce(expression);
        // Then simplify at object level
        return this.simplifyExpression(expr);
    }

    private parseExpressionOnce(expression: string): Expression {
        // Remove initial whitespace but preserve internal whitespace
        expression = expression.trim();

        // Handle negation first
        let positive = true;
        while (expression.startsWith('!')) {
            positive = !positive;
            expression = expression.slice(1).trim();
        }

        // Remove outer parentheses
        expression = this.removeOuterParentheses(expression);

        // Check for AND/OR operations
        const orParts = this.splitByOperator(expression, '||');
        if (orParts.length > 1) {
            const subExprs = orParts.map(part => this.parseExpressionOnce(part));
            return {
                expression: subExprs,
                type: 'OR',
                positive: positive
            };
        }

        const andParts = this.splitByOperator(expression, '&&');
        if (andParts.length > 1) {
            const subExprs = andParts.map(part => this.parseExpressionOnce(part));
            return {
                expression: subExprs,
                type: 'AND',
                positive: positive
            };
        }

        // Handle string literals - keep quotes in the expression
        return {
            expression: expression,
            type: 'VAR',
            positive: positive
        };
    }

    private simplifyExpression(expr: Expression): Expression {
        if (expr.type === 'VAR') {
            // Handle string literals at simplification stage
            const quoteMatch = (expr.expression as string).match(/^(['"`])(.*)\1$/);
            if (quoteMatch) {
                return {
                    ...expr,
                    expression: quoteMatch[2]
                };
            }
            return expr;
        }

        // Recursively simplify all sub-expressions
        let subExprs = (expr.expression as Expression[]).map(e => this.simplifyExpression(e));

        // Handle negation
        if (!expr.positive) {
            subExprs = subExprs.map(e => ({
                ...e,
                positive: !e.positive
            }));
            // Apply De Morgan's laws
            expr.type = expr.type === 'AND' ? 'OR' : 'AND';
            expr.positive = true;
        }

        // Flatten nested expressions of same type
        subExprs = this.flattenExpressions(subExprs, expr.type!);
        
        // Remove duplicates
        subExprs = this.removeDuplicates(subExprs);

        // If only one sub-expression remains, return it
        if (subExprs.length === 1) {
            return subExprs[0];
        }

        return {
            expression: subExprs,
            type: expr.type,
            positive: true
        };
    }

    private removeDuplicates(exprs: Expression[]): Expression[] {
        return exprs.filter((expr, index) => {
            return !exprs.some((other, otherIndex) => {
                return index > otherIndex && this.isEqual(expr, other);
            });
        });
    }

    private isEqual(expr1: Expression, expr2: Expression): boolean {
        if (expr1.type !== expr2.type || expr1.positive !== expr2.positive) {
            return false;
        }

        if (expr1.type === 'VAR') {
            return expr1.expression === expr2.expression;
        }

        const exprs1 = expr1.expression as Expression[];
        const exprs2 = expr2.expression as Expression[];

        if (exprs1.length !== exprs2.length) {
            return false;
        }

        // Sort expressions to ensure consistent comparison
        const sorted1 = [...exprs1].sort((a, b) => 
            this.expressionToString(a).localeCompare(this.expressionToString(b))
        );
        const sorted2 = [...exprs2].sort((a, b) => 
            this.expressionToString(a).localeCompare(this.expressionToString(b))
        );

        return sorted1.every((expr, i) => this.isEqual(expr, sorted2[i]));
    }

    private expressionToString(expr: Expression): string {
        if (expr.type === 'VAR') {
            return (expr.positive ? '' : '!') + expr.expression;
        }
        
        const parts = (expr.expression as Expression[]).map(
            part => this.expressionToString(part)
        );
        
        const joined = parts.join(expr.type === 'AND' ? '&&' : '||');
        return (expr.positive ? '' : '!') + `(${joined})`;
    }

    // Add new helper method to flatten nested expressions
    private flattenExpressions(exprs: Expression[], type: 'AND' | 'OR'): Expression[] {
        const result: Expression[] = [];
        
        for (const expr of exprs) {
            // Only merge if same type and positive (negation has been handled in simplifyExpression)
            if (expr.type === type) {
                result.push(...(expr.expression as Expression[]));
            } else {
                result.push(expr);
            }
        }
        
        return result;
    }

    private removeOuterParentheses(expr: string): string {
        while (expr.startsWith('(') && expr.endsWith(')')) {
            let count = 0;
            let shouldRemove = true;
            
            for (let i = 0; i < expr.length - 1; i++) {
                if (expr[i] === '(') count++;
                if (expr[i] === ')') count--;
                // If count becomes 0 before the last character, these parentheses are necessary
                if (count === 0 && i < expr.length - 1) {
                    shouldRemove = false;
                    break;
                }
            }
            
            if (!shouldRemove) break;
            expr = expr.slice(1, -1);
        }
        return expr;
    }

    private splitByOperator(expr: string, operator: string): string[] {
        const parts: string[] = [];
        let current = '';
        let parenCount = 0;
        let inQuote = false;
        let quoteChar = '';
        
        for (let i = 0; i < expr.length; i++) {
            const char = expr[i];
            
            // Handle quotes
            if ((char === '"' || char === "'" || char === '`') && 
                (i === 0 || expr[i-1] !== '\\')) {
                if (!inQuote) {
                    inQuote = true;
                    quoteChar = char;
                } else if (char === quoteChar) {
                    inQuote = false;
                }
            }
            
            // Only count parentheses when not in quotes
            if (!inQuote) {
                if (char === '(') parenCount++;
                else if (char === ')') parenCount--;
            }
            
            // Only split when not in quotes and not inside parentheses
            if (!inQuote && parenCount === 0 && expr.slice(i).startsWith(operator)) {
                parts.push(current.trim());
                current = '';
                i += operator.length - 1;
                continue;
            }
            
            current += char;
        }
        
        if (current) parts.push(current.trim());
        return parts.length > 0 ? parts : [expr];
    }
}

export class MinecraftCondition {
    private logicExpression: LogicExpression;

    constructor(expression: string) {
        this.logicExpression = new LogicExpression(expression);
        this.toAndNotForm();
    }

    /**
     * Converts the logic expression to a form that only uses AND and NOT operations
     */
    private toAndNotForm(): LogicExpression {
        this.convertExpression(this.logicExpression);
        return this.logicExpression;
    }

    private convertExpression(expr: Expression): void {
        // If it's an OR expression, convert it using distributive law
        if (expr.type === 'OR') {
            expr.positive = !expr.positive;

            (expr.expression as LogicExpression[]).forEach((part) => {
                this.convertExpression(part);
                part.positive = !part.positive;
            });

            expr.type = "AND";
        }
    }

    private expressionToString(expr: Expression): string {
        if (expr.type === 'VAR') {
            return expr.expression as string;
        }
        
        const parts = (expr.expression as Expression[]).map(
            part => this.expressionToString(part)
        );
        
        const joined = parts.join(expr.type === 'AND' ? '&&' : '||');
        return `(${joined})`;
    }

    public build(thenBlock: string, elseBlock?: string): string {
        let commands: string[] = [];
        console.log(this.logicExpression);
        if(this.logicExpression.type === "VAR") {
            // If it is only a single variable, we directly jump according to it.
            commands.push(`inj.jump("${this.logicExpression.positive ? "if" : "unless"} ${this.logicExpression.expression}", () => {
                ${thenBlock}
            });`);
            if (elseBlock) {
                commands.push(`inj.jump("${this.logicExpression.positive ? "unless" : "if"} ${this.logicExpression.expression}", () => {
                    ${elseBlock}
                });`);
            }
        } else if(this.logicExpression.type === "AND") {
            // If it is an AND of multiple variables, process each one.
            let items: string[] = [];
            for(const item of this.logicExpression.expression as Expression[]) {
                items.push(`${item.positive ? "if" : "unless"} ${item.expression}`);
            }
            commands.push(`inj.jump("${items.join(" ")}", () => {
                ${thenBlock}
            });`);
            if (elseBlock) {
                items.splice(0, items.length);
                for(const item of this.logicExpression.expression as Expression[]) {
                    items.push(`${item.positive ? "unless" : "if"} ${item.expression}`);
                }
                commands.push(`inj.jump("${items.join(" ")}", () => {
                    ${elseBlock}
                });`);
            }
        }
        return commands.join("\n");
    }
}
