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
        input = input.replace(/\s+/g, '');
        const parsed = this.parseExpression(input);
        this.expression = parsed.expression;
        this.type = parsed.type;
        this.positive = parsed.positive;
    }

    private parseExpression(expression: string): Expression {
        let positive = true;
        
        // Handle negation
        while (expression.startsWith('!')) {
            positive = !positive;
            expression = expression.slice(1);
        }
        
        expression = this.removeOuterParentheses(expression);

        const orParts = this.splitByOperator(expression, '||');
        if (orParts.length > 1) {
            return {
                expression: orParts.map(part => new LogicExpression(part)),
                type: 'OR',
                positive
            };
        }

        const andParts = this.splitByOperator(expression, '&&');
        if (andParts.length > 1) {
            return {
                expression: andParts.map(part => new LogicExpression(part)),
                type: 'AND',
                positive
            };
        }

        return {
            expression: expression,
            type: 'VAR',
            positive
        };
    }

    private removeOuterParentheses(expr: string): string {
        if (expr.startsWith('(') && expr.endsWith(')')) {
            let count = 0;
            for (let i = 0; i < expr.length - 1; i++) {
                if (expr[i] === '(') count++;
                if (expr[i] === ')') count--;
                if (count === 0 && i < expr.length - 1) return expr;
            }
            return this.removeOuterParentheses(expr.slice(1, -1));
        }
        return expr;
    }

    private splitByOperator(expr: string, operator: string): string[] {
        const parts: string[] = [];
        let current = '';
        let parenCount = 0;
        
        for (let i = 0; i < expr.length; i++) {
            if (expr[i] === '(') parenCount++;
            else if (expr[i] === ')') parenCount--;
            
            if (parenCount === 0 && expr.slice(i).startsWith(operator)) {
                parts.push(current);
                current = '';
                i += operator.length - 1;
                continue;
            }
            
            current += expr[i];
        }
        
        if (current) parts.push(current);
        return parts.length > 0 ? parts : [expr];
    }
}

export class MinecraftCondition {
    private logicExpression: LogicExpression;

    constructor(expression: string) {
        this.logicExpression = new LogicExpression(expression);
    }

    /**
     * Converts the logic expression to a form that only uses AND and NOT operations
     */
    public toAndNotForm(): LogicExpression {
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
}
