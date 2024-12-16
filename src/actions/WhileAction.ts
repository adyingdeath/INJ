import { Action } from './Action.js';
import { LogicParser } from './LogicParser.js';

/**
 * 处理while循环的Action
 */
export class WhileAction extends Action {
  private logicParser: LogicParser;

  constructor() {
    super();
    this.logicParser = new LogicParser();
  }

  execute(condition: string, body?: string[]): string[] {
    const commands: string[] = [];
    
    // 创建循环标记
    const loopLabel = `while_${Math.random().toString(36).substr(2, 9)}`;
    
    // 创建循环函数
    commands.push(`# ${loopLabel}.mcfunction:`);
    
    // 解析条件
    commands.push(...this.logicParser.parse(condition));
    
    // 添加主体内容
    if (body && body.length > 0) {
      commands.push('execute if score #LAST_RESULT temp matches 1 run {');
      commands.push(...body);
      commands.push(`function ${loopLabel}`);
      commands.push('}');
    }
    
    return commands;
  }
} 