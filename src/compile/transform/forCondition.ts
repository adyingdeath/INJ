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

// Function to check if an expression is a Minecraft condition
function isMinecraftCondition(expr: Expression): boolean {
    // If it's a string literal, it's valid
    if (t.isStringLiteral(expr)) {
        return true;
    }

    // If it's a logical expression (AND/OR), check both operands
    if (t.isLogicalExpression(expr)) {
        return isMinecraftCondition(expr.left) && isMinecraftCondition(expr.right);
    }

    // If it's a unary expression (NOT), check its argument
    if (t.isUnaryExpression(expr) && expr.operator === '!') {
        return isMinecraftCondition(expr.argument);
    }

    // If it's any other type of expression, it's not a valid Minecraft condition
    return false;
}

// Export the Babel plugin
export default function forCondition() {
    return {
        name: "transform-for-condition",
        visitor: {
            IfStatement: {
                exit(path: any) {
                    const test = path.node.test;
                    
                    if (t.isCallExpression(test) && t.isMemberExpression(test.callee)) {
                        // #region case-call
                        // is the form like ().and() or ().or();
                        const callee = test.callee;
                        if (!(t.isIdentifier(callee.property)
                            && (callee.property.name === "and" || callee.property.name === "or")
                        )) {
                            // Check if it's a method call with 'and' or 'or', if not, return
                            return;
                        }
                        switch (callee.object.type) {
                            case "UnaryExpression":
                                if (callee.object.operator != "!") break;
                            case "LogicalExpression": {
                                // Forms like ("A" & "B").and()
                                // Transform the logical expression
                                const transformedLogic = applyDeMorganLaws(callee.object);
                                const simplified = simplifyLogic(transformedLogic);
                                // Replace the original object with the transformed one
                                callee.object = simplified;
                                break;
                            }
                            case "StringLiteral": {
                                // Handle cases like "A".and() or "A".or()
                                const methodName = callee.property.name;
                                if (methodName === "and") {
                                    // Get the condition string from StringLiteral
                                    const baseCondition = (callee.object as t.StringLiteral).value.trim();
                                    
                                    // Get the condition from function arguments
                                    const jsCondition = test.arguments[0]; // Get the first argument as the if condition
                                    
                                    // Replace the test condition with the argument condition
                                    path.get('test').replaceWith(jsCondition);
                                    
                                    // Create if/unless execute blocks
                                    const ifExecute = t.callExpression(
                                        t.memberExpression(
                                            t.identifier("inj"),
                                            t.identifier("jump")
                                        ),
                                        [
                                            t.arrayExpression(
                                                [t.stringLiteral("if " + baseCondition)]
                                            ),
                                            t.arrowFunctionExpression(
                                                [],
                                                t.blockStatement(path.node.consequent.body)
                                            )
                                        ]
                                    );
                                    
                                    const unlessExecute = t.callExpression(
                                        t.memberExpression(
                                            t.identifier("inj"), 
                                            t.identifier("jump")
                                        ),
                                        [
                                            t.arrayExpression(
                                                [t.stringLiteral("unless " + baseCondition)]
                                            ),
                                            t.arrowFunctionExpression(
                                                [],
                                                t.blockStatement(path.node.alternate ? path.node.alternate.body : [])
                                            )
                                        ]
                                    );

                                    // Create statements to insert at the beginning of then block
                                    const statementsToInsert = [];
                                    statementsToInsert.push(t.expressionStatement(ifExecute));
                                    if (path.node.alternate != null) {
                                        statementsToInsert.push(t.expressionStatement(unlessExecute));
                                    }

                                    // Create a new BlockStatement with our statements at the beginning
                                    const newConsequent = t.blockStatement(statementsToInsert);

                                    // Replace the entire consequent
                                    path.get('consequent').replaceWith(newConsequent);
                                } else if (methodName === "or") {
                                    // Get the condition string from StringLiteral
                                    const baseCondition = (callee.object as t.StringLiteral).value.trim();
                                    
                                    // Get the condition from function arguments
                                    const jsCondition = test.arguments[0]; // Get the first argument as the if condition
                                    
                                    // Replace the test condition with the argument condition
                                    path.get('test').replaceWith(jsCondition);
                                    
                                    // Create if/unless execute blocks for Minecraft command
                                    const mcConditionCheck = t.callExpression(
                                        t.memberExpression(
                                            t.identifier("inj"),
                                            t.identifier("jump")
                                        ),
                                        [
                                            t.arrayExpression(
                                                [t.stringLiteral("if " + baseCondition)]
                                            ),
                                            t.arrowFunctionExpression(
                                                [],
                                                t.blockStatement(path.node.consequent.body)
                                            )
                                        ]
                                    );

                                    // - If JS condition is true, execute the body directly
                                    // - If JS condition is false:
                                    //   - If Minecraft condition is true, execute the body
                                    //   - If Minecraft condition is false, execute the alternate

                                    // Replace the entire consequent. Now the consequent will be run if the JS condition is true.
                                    path.get('consequent').replaceWith(t.blockStatement(path.node.consequent.body));

                                    // Create if/unless execute blocks
                                    const ifExecute = t.callExpression(
                                        t.memberExpression(
                                            t.identifier("inj"),
                                            t.identifier("jump")
                                        ),
                                        [
                                            t.arrayExpression(
                                                [t.stringLiteral("if " + baseCondition)]
                                            ),
                                            t.arrowFunctionExpression(
                                                [],
                                                t.blockStatement(path.node.consequent.body)
                                            )
                                        ]
                                    );
                                    
                                    const unlessExecute = t.callExpression(
                                        t.memberExpression(
                                            t.identifier("inj"), 
                                            t.identifier("jump")
                                        ),
                                        [
                                            t.arrayExpression(
                                                [t.stringLiteral("unless " + baseCondition)]
                                            ),
                                            t.arrowFunctionExpression(
                                                [],
                                                t.blockStatement(path.node.alternate ? path.node.alternate.body : [])
                                            )
                                        ]
                                    );

                                    // Create statements to insert at the beginning of then block
                                    const statementsToInsert = [];
                                    statementsToInsert.push(t.expressionStatement(ifExecute));
                                    if (path.node.alternate != null) {
                                        statementsToInsert.push(t.expressionStatement(unlessExecute));
                                    }

                                    // Create a new BlockStatement with our statements at the beginning
                                    const newAlternate = t.blockStatement(statementsToInsert);

                                    // Replace the entire alternate
                                    path.get('alternate').replaceWith(newAlternate);
                                }
                                break;
                            }
                        }
                        // #endregion
                    } else if (isMinecraftCondition(test)) {
                        // #region case-pure-mc
                        // Handle pure Minecraft condition...
                        console.log("Minecraft condition detected");
                        // #endregion
                    } else {
                        // #region case-pure-js
                        // Handle JS condition
                        console.log("JS condition detected");
                        // #endregion
                    }
                }
            }
        }
    };
}

