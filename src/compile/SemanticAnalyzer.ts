import {
    ASTNode, Program, Statement, MinecraftCommand, JSCode,
    IfStatement, WhileStatement, ForStatement, Expression
} from './AST.js';

// Import isolated-vm for JavaScript code validation
import ivm from 'isolated-vm';

/**
 * Context interface for storing analysis state
 */
interface Context {
    currentScope: Scope;
    errors: SemanticError[];
}

/**
 * Scope class for managing variable and function scopes
 */
class Scope {
    private parent: Scope | null;
    private declarations: Map<string, Declaration>;

    constructor(parent: Scope | null = null) {
        this.parent = parent;
        this.declarations = new Map();
    }

    /**
     * Declare a new variable or function in current scope
     * @throws {Error} If name is already declared in current scope
     */
    declare(name: string, type: DeclarationType): void {
        if (this.declarations.has(name)) {
            throw new Error(`Duplicate declaration: ${name}`);
        }
        this.declarations.set(name, { name, type });
    }

    /**
     * Resolve a name in current scope or parent scopes
     * @returns Declaration if found, null otherwise
     */
    resolve(name: string): Declaration | null {
        const declaration = this.declarations.get(name);
        if (declaration) return declaration;
        if (this.parent) return this.parent.resolve(name);
        return null;
    }
}

// Declaration types
type DeclarationType = 'variable' | 'function';

/**
 * Interface for variable and function declarations
 */
interface Declaration {
    name: string;
    type: DeclarationType;
}

/**
 * Class representing a semantic error during analysis
 */
class SemanticError {
    constructor(
        public node: ASTNode,
        public message: string
    ) {}

    toString(): string {
        return `Semantic Error at position ${this.node.start}-${this.node.end}: ${this.message}`;
    }
}

/**
 * Semantic analyzer for validating program structure and semantics
 */
export class SemanticAnalyzer {
    private context: Context;
    private isolate: ivm.Isolate;

    constructor() {
        this.context = {
            currentScope: new Scope(),
            errors: []
        };
        // Initialize isolate with 8MB memory limit for JS code validation
        this.isolate = new ivm.Isolate({ memoryLimit: 8 });
    }

    /**
     * Main analysis entry point
     * @returns Array of semantic errors found during analysis
     */
    analyze(program: Program): SemanticError[] {
        this.visitProgram(program);
        return this.context.errors;
    }

    private visitProgram(program: Program) {
        // Create global scope for the program
        this.context.currentScope = new Scope();
        
        for (const statement of program.body) {
            this.visitStatement(statement);
        }
    }

    private visitStatement(statement: Statement) {
        // Visit different statement types
        switch (statement.type) {
            case 'MinecraftCommand':
                this.visitMinecraftCommand(statement);
                break;
            case 'JSCode':
                this.visitJSCode(statement);
                break;
            case 'IfStatement':
                this.visitIfStatement(statement);
                break;
            case 'WhileStatement':
                this.visitWhileStatement(statement);
                break;
            case 'ForStatement':
                this.visitForStatement(statement);
                break;
        }
    }

    private visitMinecraftCommand(command: MinecraftCommand) {
        // TODO: Add Minecraft command validation logic
    }

    /**
     * Validate JavaScript code in isolated environment
     */
    private async checkJSCode(code: string, node: ASTNode): Promise<void> {
        const context = await this.isolate.createContext();
        const jail = context.global;
        const isolate = this.isolate;

        try {
            // Run JS code with 5ms timeout for safety
            const script = await isolate.compileScript(code);
            await script.run(context, { timeout: 5 });
        } catch (e: any) {
            this.addError(node, `Invalid JavaScript code: ${e.message}`);
        }
    }

    private visitJSCode(code: JSCode) {
        // Validate JavaScript code semantics
        this.checkJSCode(code.code, code);
    }

    private visitIfStatement(statement: IfStatement) {
        // Check condition expression
        this.checkCondition(statement.condition, statement);

        // Create new scope for if block
        const previousScope = this.context.currentScope;
        this.context.currentScope = new Scope(previousScope);

        // Visit consequent statements
        for (const stmt of statement.consequent) {
            this.visitStatement(stmt);
        }

        // Handle else block if present
        if (statement.alternate) {
            // Create new scope for else block
            this.context.currentScope = new Scope(previousScope);
            for (const stmt of statement.alternate) {
                this.visitStatement(stmt);
            }
        }

        // Restore previous scope
        this.context.currentScope = previousScope;
    }

    private visitWhileStatement(statement: WhileStatement) {
        // Validate loop condition
        this.checkCondition(statement.condition, statement);

        // Create new scope for loop body
        const previousScope = this.context.currentScope;
        this.context.currentScope = new Scope(previousScope);

        // Visit loop body statements
        for (const stmt of statement.body) {
            this.visitStatement(stmt);
        }

        // Restore previous scope
        this.context.currentScope = previousScope;
    }

    private visitForStatement(statement: ForStatement) {
        // Validate for loop parameters
        if (!statement.params.trim()) {
            this.addError(statement, "Empty for loop parameters");
        }

        // Check if for loop syntax is valid
        this.checkJSCode(`for (${statement.params}) {}`, statement);

        // Create new scope for loop body
        const previousScope = this.context.currentScope;
        this.context.currentScope = new Scope(previousScope);

        // Visit loop body statements
        for (const stmt of statement.body) {
            this.visitStatement(stmt);
        }

        // Restore previous scope
        this.context.currentScope = previousScope;
    }

    /**
     * Validate condition expressions for control structures
     */
    private checkCondition(condition: Expression, node: ASTNode) {
        // Validate Minecraft condition
        if (condition.minecraft) {
            // TODO: Add more Minecraft command validation logic
            if (!condition.minecraft.trim()) {
                this.addError(node, "Empty Minecraft condition");
            }
        }

        // Validate JavaScript condition
        if (condition.js) {
            this.checkJSCode(`if (${condition.js}) {}`, node);
        }

        // Check logical operators
        if (condition.logic && !condition.minecraft && !condition.js) {
            this.addError(node, "Logic operator used without conditions");
        }
    }

    private addError(node: ASTNode, message: string) {
        this.context.errors.push(new SemanticError(node, message));
    }
} 