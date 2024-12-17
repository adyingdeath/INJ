import {
    ASTNode, Program, Statement, MinecraftCommand, JSCode,
    IfStatement, WhileStatement, ForStatement, Expression
} from './AST.js';

// 添加 isolated-vm 导入
import ivm from 'isolated-vm';

// 用于记录分析过程中的上下文信息
interface Context {
    currentScope: Scope;
    errors: SemanticError[];
}

// 作用域类,用于管理变量和函数的作用域
class Scope {
    private parent: Scope | null;
    private declarations: Map<string, Declaration>;

    constructor(parent: Scope | null = null) {
        this.parent = parent;
        this.declarations = new Map();
    }

    declare(name: string, type: DeclarationType): void {
        if (this.declarations.has(name)) {
            throw new Error(`Duplicate declaration: ${name}`);
        }
        this.declarations.set(name, { name, type });
    }

    resolve(name: string): Declaration | null {
        const declaration = this.declarations.get(name);
        if (declaration) return declaration;
        if (this.parent) return this.parent.resolve(name);
        return null;
    }
}

// 声明类型
type DeclarationType = 'variable' | 'function';

// 声明接口
interface Declaration {
    name: string;
    type: DeclarationType;
}

// 语义错误类
class SemanticError {
    constructor(
        public node: ASTNode,
        public message: string
    ) {}

    toString(): string {
        return `Semantic Error at position ${this.node.start}-${this.node.end}: ${this.message}`;
    }
}

export class SemanticAnalyzer {
    private context: Context;
    private isolate: ivm.Isolate;

    constructor() {
        this.context = {
            currentScope: new Scope(),
            errors: []
        };
        // Initialize isolate with 8MB memory limit
        this.isolate = new ivm.Isolate({ memoryLimit: 8 });
    }

    // 主分析方法
    analyze(program: Program): SemanticError[] {
        this.visitProgram(program);
        return this.context.errors;
    }

    private visitProgram(program: Program) {
        // 为程序创建全局作用域
        this.context.currentScope = new Scope();
        
        for (const statement of program.body) {
            this.visitStatement(statement);
        }
    }

    private visitStatement(statement: Statement) {
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
        // 检查Minecraft命令的语义
        
    }

    private async checkJSCode(code: string, node: ASTNode): Promise<void> {
        const context = await this.isolate.createContext();
        const jail = context.global;
        const isolate = this.isolate;

        try {
            // Create a new context with 5ms timeout
            const script = await isolate.compileScript(code);
            await script.run(context, { timeout: 5 });
        } catch (e: any) {
            this.addError(node, `Invalid JavaScript code: ${e.message}`);
        }
    }

    private visitJSCode(code: JSCode) {
        // 检查JS代码的语义
        this.checkJSCode(code.code, code);
    }

    private visitIfStatement(statement: IfStatement) {
        // 检查条件表达式
        this.checkCondition(statement.condition, statement);

        // 创建新的作用域
        const previousScope = this.context.currentScope;
        this.context.currentScope = new Scope(previousScope);

        // 访问consequent语句
        for (const stmt of statement.consequent) {
            this.visitStatement(stmt);
        }

        // 如果有else分支，也要访问
        if (statement.alternate) {
            // 为else分支创建新的作用域
            this.context.currentScope = new Scope(previousScope);
            for (const stmt of statement.alternate) {
                this.visitStatement(stmt);
            }
        }

        // 恢复原来的作用域
        this.context.currentScope = previousScope;
    }

    private visitWhileStatement(statement: WhileStatement) {
        // 检查循环条件
        this.checkCondition(statement.condition, statement);

        // 创建新的作用域
        const previousScope = this.context.currentScope;
        this.context.currentScope = new Scope(previousScope);

        // 访问循环体
        for (const stmt of statement.body) {
            this.visitStatement(stmt);
        }

        // 恢复原��的作用域
        this.context.currentScope = previousScope;
    }

    private visitForStatement(statement: ForStatement) {
        // 检查for循环参数
        if (!statement.params.trim()) {
            this.addError(statement, "Empty for loop parameters");
        }

        this.checkJSCode(`for (${statement.params}) {}`, statement);

        // 创建新的作用域
        const previousScope = this.context.currentScope;
        this.context.currentScope = new Scope(previousScope);

        // 访问循环体
        for (const stmt of statement.body) {
            this.visitStatement(stmt);
        }

        // 恢复原来的作用域
        this.context.currentScope = previousScope;
    }

    private checkCondition(condition: Expression, node: ASTNode) {
        // 检查Minecraft条件
        if (condition.minecraft) {
            // 这里可以添加更多的Minecraft命令验证逻辑
            if (!condition.minecraft.trim()) {
                this.addError(node, "Empty Minecraft condition");
            }
        }

        // 检查JS条件
        if (condition.js) {
            this.checkJSCode(`if (${condition.js}) {}`, node);
        }

        // 检查逻辑组合
        if (condition.logic && !condition.minecraft && !condition.js) {
            this.addError(node, "Logic operator used without conditions");
        }
    }

    private addError(node: ASTNode, message: string) {
        this.context.errors.push(new SemanticError(node, message));
    }
} 