import { Program, Node, Expression, LogicalExpression, UnaryExpression, MemberExpression, CallExpression, IfStatement } from "@babel/types";
import * as t from "@babel/types";

// Function to apply De Morgan's Laws and transform all the OR operations to AND+NOT operations.
function applyDeMorganLaws(expr: Expression): Expression {
    if (!t.isLogicalExpression(expr)) {
        return expr;
    }

    if (expr.operator === '||') {
        // Convert (A || B) to !(!A && !B)
        const negatedLeft = t.unaryExpression('!', applyDeMorganLaws(expr.left));
        const negatedRight = t.unaryExpression('!', applyDeMorganLaws(expr.right));
        const andExpr = t.logicalExpression('&&', negatedLeft, negatedRight);
        return t.unaryExpression('!', andExpr);
    }

    // Recursively transform both sides of AND operations
    if (expr.operator === '&&') {
        return t.logicalExpression(
            '&&',
            applyDeMorganLaws(expr.left),
            applyDeMorganLaws(expr.right)
        );
    }

    return expr;
}

// Function to simplify logical expressions
function simplifyLogic(expr: Expression): Expression {
    let hasChanged = true;
    let result = expr;
    
    while (hasChanged) {
        hasChanged = false;
        result = simplifyOnce(result, (changed) => {
            hasChanged = hasChanged || changed;
        });
    }
    
    return result;
}

// Single round of simplification
function simplifyOnce(expr: Expression, setChanged: (changed: boolean) => void): Expression {
    if (t.isUnaryExpression(expr) && expr.operator === '!') {
        const argument = expr.argument;

        // Simplify double negation: !!A → A
        if (t.isUnaryExpression(argument) && argument.operator === '!') {
            setChanged(true);
            return simplifyOnce(argument.argument, setChanged);
        }

        // If we can't simplify further, return the NOT operation as is
        return t.unaryExpression('!', simplifyOnce(argument, setChanged));
    }

    if (t.isLogicalExpression(expr)) {
        const simplifiedLeft = simplifyOnce(expr.left, setChanged);
        const simplifiedRight = simplifyOnce(expr.right, setChanged);

        // If both operands are the same, return one of them (for AND operation)
        if (expr.operator === '&&' &&
            JSON.stringify(simplifiedLeft) === JSON.stringify(simplifiedRight)) {
            setChanged(true);
            return simplifiedLeft;
        }

        // If it's an OR operation, convert it to AND using De Morgan's law
        if (expr.operator === '||') {
            // A || B => !(!A && !B)
            setChanged(true);
            return t.unaryExpression('!', 
                t.logicalExpression(
                    '&&',
                    t.unaryExpression('!', simplifiedLeft),
                    t.unaryExpression('!', simplifiedRight)
                )
            );
        }

        // Check if anything changed in the subexpressions
        if (JSON.stringify(simplifiedLeft) !== JSON.stringify(expr.left) ||
            JSON.stringify(simplifiedRight) !== JSON.stringify(expr.right)) {
            setChanged(true);
        }

        // For AND operations, return the simplified version
        return t.logicalExpression('&&', simplifiedLeft, simplifiedRight);
    }

    return expr;
}

// Export the Babel plugin
export default function forCondition() {
    return {
        name: "transform-for-condition",
        visitor: {
            IfStatement: {
                enter(path: any) {
                    const test = path.node.test;
                    
                    if (t.isCallExpression(test)) {
                        if (t.isMemberExpression(test.callee)) {
                            const callee = test.callee;
                            if (t.isLogicalExpression(callee.object)) {
                                // Transform the logical expression
                                const transformedLogic = applyDeMorganLaws(callee.object);
                                const simplified = simplifyLogic(transformedLogic);
                                // Replace the original object with the transformed one
                                callee.object = simplified;
                            }
                        }
                    }
                }
            }
        }
    };
}

