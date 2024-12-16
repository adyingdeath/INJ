import { Action } from './Action.js';
import { LogicParser } from './LogicParser.js';

/**
 * 处理if语句的Action
 */
export class IfAction extends Action {
    private logicParser: LogicParser;

    constructor() {
        super();
        this.logicParser = new LogicParser();
    }

    execute(condition: string, body?: string[]): string[] {
        const commands: string[] = [];

        // 解析条件
        commands.push(...this.logicParser.parse(condition));

        // 添加主体内容
        if (body && body.length > 0) {
            commands.push('execute if score #LAST_RESULT temp matches 1 run {');
            commands.push(...body);
            commands.push('}');
        }

        return commands;
    }
} 