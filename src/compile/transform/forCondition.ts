import { Expression } from "@babel/types";
import * as t from "@babel/types";
import randomCode from "../../util/randomCode.js";

// Add these type definitions after the imports
interface LogicUnit {
    type: "Var" | "Ref";
    name?: string;
    ref?: number;
    positive: boolean;
}

interface LogicSegment {
    vars: LogicUnit[];
}

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

/**
 * Decompose a logical expression into a list of segments.
 * Each segment is the AND of a list of variables(or negated variables).
 * @param expr - The logical expression to decompose.
 * @returns An array of segments, each containing a list of variables.
 */
function segmentLogic(expr: Expression): LogicSegment[] {
    const segments: LogicSegment[] = [];

    // Helper function to process an expression and return its reference
    function processExpr(expr: Expression, parent: LogicSegment, positive: boolean): void {
        if (t.isStringLiteral(expr)) {
            // If the expression is a string literal, add it directly to segments
            parent.vars.push({
                type: "Var",
                name: expr.value.trim(),
                positive: positive
            });
        } else if (t.isUnaryExpression(expr) && expr.operator === '!') {
            if (t.isStringLiteral(expr.argument)) {
                parent.vars.push({
                    type: "Var",
                    name: expr.argument.value.trim(),
                    positive: false
                });
            } else {
                // If the argument is not a string literal(which means it's a logical expression), we need to create a new segment
                let index = segments.length;
                let seg = { vars: [] };
                segments.push(seg);
                processExpr(expr.argument, seg, true);
                parent.vars.push({
                    type: "Ref",
                    ref: index,
                    positive: false
                });
            }
        } else if (t.isLogicalExpression(expr) && expr.operator === '&&') {
            processExpr(expr.left, parent, true);
            processExpr(expr.right, parent, true);
        }
    }

    let seg = { vars: [] };

    segments.push(seg);

    processExpr(expr, seg, true);

    return segments;
}

interface IfAndUnlessStatements {
    if: t.ExpressionStatement[];
    unless: t.ExpressionStatement[];
}

function createIfAndUnlessStatements(path: any, segments: LogicSegment[]): IfAndUnlessStatements {

    /**
     * Map a segment variable to a string in execute command.
     * @param unit - The variable to map.
     * @param id - The id of the segment.
     * @returns The string in execute command.
     */
    function mapSegmentVars(unit: LogicUnit) {
        let result;
        if (unit.type == "Var") {
            result = unit.name;
        } else if (unit.type == "Ref") {
            result = `entity @s[scores={INJ_LOGIC=${segments.length}}]`;
        }
        return `${unit.positive ? "if" : "unless"} ${result}`;
    }
    // TODO: handle the problem that when the scoreboard is not set, the execute command will not work. Because test score = 1 will fail when the score is undefined.
    // Create if/unless execute blocks
    const ifExecute =
        segments.map((seg: LogicSegment, index: number) => {
            if (index == 0) {
                return t.expressionStatement(
                    t.callExpression(
                        t.memberExpression(
                            t.memberExpression(
                                t.identifier("this"),
                                t.identifier("INJ")
                            ),
                            t.identifier("jump")
                        ),
                        [
                            t.stringLiteral(
                                seg.vars.map((v) => mapSegmentVars(v)).join(" ")
                            ),
                            t.arrowFunctionExpression(
                                [],
                                t.blockStatement(path.node.consequent.body)
                            )
                        ]
                    )
                );
            } else {
                let command: string[] = [];
                command.push("execute");
                command.push(seg.vars.map((v) => mapSegmentVars(v)).join(" "));
                command.push("run");
                command.push(`scoreboard players add @s INJ_LOGIC 1`);
                return t.expressionStatement(
                    t.callExpression(
                        t.identifier("$"),
                        [
                            t.arrayExpression(
                                [t.stringLiteral(
                                    command.join(" ")
                                )]
                            )
                        ]
                    )
                );
            }
        }).reverse();


    const unlessExecute =
        segments.map((seg: LogicSegment, index: number) => {
            let command: string[] = [];
            command.push("execute");
            command.push(seg.vars.map((v) => mapSegmentVars(v)).join(" "));
            command.push("run");
            command.push(`scoreboard players add @s INJ_LOGIC 1`);
            return t.expressionStatement(
                t.callExpression(
                    t.identifier("$"),
                    [
                        t.arrayExpression(
                            [t.stringLiteral(
                                command.join(" ")
                            )]
                        )
                    ]
                )
            );
        }).reverse();
    unlessExecute.push(
        t.expressionStatement(
            t.callExpression(
                t.memberExpression(
                    t.memberExpression(
                        t.identifier("this"),
                        t.identifier("INJ")
                    ),
                    t.identifier("jump")
                ),
                [
                    t.stringLiteral(
                        ([{ type: "Ref", ref: 0, positive: false }] as LogicUnit[]).map((v) => mapSegmentVars(v)).join(" ")
                    ),
                    t.arrowFunctionExpression(
                        [],
                        t.blockStatement(path.node.alternate ? path.node.alternate.body : [])
                    ),
                ]
            )
        )
    );
    unlessExecute.unshift(
        t.expressionStatement(
            t.callExpression(
                t.identifier("$"),
                [t.stringLiteral(`scoreboard players set @s INJ_LOGIC 0`)]
            )
        )
    );

    return {
        if: ifExecute,
        unless: unlessExecute
    };
}

// Export the Babel plugin
export default function forCondition() {
    return {
        name: "transform-for-condition",
        visitor: {
            IfStatement: {
                exit(path: any) {
                    const test: Expression = path.node.test;
                    let segments: LogicSegment[] = [];

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
                            }
                            case "StringLiteral": {
                                let segments = segmentLogic(callee.object);
                                
                                const { if: ifExecute, unless: unlessExecute } = createIfAndUnlessStatements(path, segments);

                                // Get the condition from function arguments
                                const jsCondition = test.arguments[0]; // Get the first argument as the if condition


                                // Create statements to insert at the beginning of then block
                                const statementsToInsert: t.ExpressionStatement[] = [];
                                if (ifExecute.length === 1) {
                                    statementsToInsert.push(ifExecute[0]);
                                } else {
                                    statementsToInsert.push(...ifExecute);
                                }
                                
                                if (notnull(path.node.alternate)) {
                                    if (unlessExecute.length === 1) {
                                        statementsToInsert.push(unlessExecute[0]);
                                    } else {
                                        statementsToInsert.push(...unlessExecute);
                                    }
                                }

                                // Handle cases like "A".and() or "A".or()
                                const methodName = callee.property.name;
                                if (methodName === "and") {

                                    // Replace the test condition with the argument condition
                                    path.get('test').replaceWith(jsCondition);

                                    // Create a new BlockStatement with our statements at the beginning
                                    const newConsequent = t.blockStatement(statementsToInsert);

                                    // Replace the entire consequent
                                    path.get('consequent').replaceWith(newConsequent);
                                } else if (methodName === "or") {

                                    // Replace the entire consequent. Now the consequent will be run if the JS condition is true.
                                    path.get('consequent').replaceWith(t.blockStatement(path.node.consequent.body));

                                    // - If JS condition is true, execute the body directly
                                    // - If JS condition is false:
                                    //   - If Minecraft condition is true, execute the body
                                    //   - If Minecraft condition is false, execute the alternate

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
                        // Handle pure Minecraft condition

                        // Transform the logical expression
                        const transformedLogic = applyDeMorganLaws(test);
                        const simplified = simplifyLogic(transformedLogic);
                        // Replace the original object with the transformed one
                        let segments = segmentLogic(simplified);
                        const { if: ifExecute, unless: unlessExecute } = createIfAndUnlessStatements(path, segments);

                        // Create if/unless execute blocks for pure Minecraft conditions
                        const executeStatements = notnull(path.node.alternate) ? [...ifExecute, ...unlessExecute] : [...ifExecute];

                        // Replace the entire if statement with our execute statements
                        path.replaceWithMultiple(executeStatements);
                        // #endregion
                    } else {
                        // #region case-pure-js
                        // Handle JS condition
                        
                        // Do nothing...

                        // #endregion
                    }
                }
            }
        }
    };
}

function notnull(obj: any): boolean {
    return obj != null && obj != undefined;
}