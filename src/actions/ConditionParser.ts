/**
 * 用于解析 if/while 条件的解析器
 */
export class ConditionParser {
  private conditions: string[] = [];
  private operators: string[] = [];
  
  /**
   * 解析条件表达式
   * @param condition 完整的条件表达式
   * @returns 处理后的命令列表
   */
  parse(condition: string): string[] {
    // 分割条件
    const tokens = this.tokenize(condition);
    return this.buildCommands(tokens);
  }

  /**
   * 将条件字符串转换为标记
   */
  private tokenize(condition: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inCondition = false;
    
    for (let i = 0; i < condition.length; i++) {
      const char = condition[i];
      
      if (char === '(' || char === ')') {
        if (current.trim()) {
          tokens.push(current.trim());
          current = '';
        }
        tokens.push(char);
      } else if (char === '&' || char === '|') {
        if (current.trim()) {
          tokens.push(current.trim());
          current = '';
        }
        // 跳过重复的运算符字符
        if (condition[i + 1] === char) {
          i++;
        }
        tokens.push(char === '&' ? '&&' : '||');
      } else if (char === '!') {
        if (current.trim()) {
          tokens.push(current.trim());
          current = '';
        }
        tokens.push('!');
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      tokens.push(current.trim());
    }
    
    return tokens;
  }

  /**
   * 构建Minecraft命令
   */
  private buildCommands(tokens: string[]): string[] {
    const commands: string[] = [];
    const stack: string[] = [];
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      if (token === '(') {
        stack.push(token);
      } else if (token === ')') {
        while (stack.length > 0 && stack[stack.length - 1] !== '(') {
          commands.push(this.createCommand(stack.pop()!));
        }
        stack.pop(); // 移除 '('
      } else if (token === '&&' || token === '||' || token === '!') {
        while (stack.length > 0 && this.getPrecedence(stack[stack.length - 1]) >= this.getPrecedence(token)) {
          commands.push(this.createCommand(stack.pop()!));
        }
        stack.push(token);
      } else {
        // 这是一个条件文本
        commands.push(`execute if ${token}`);
      }
    }
    
    while (stack.length > 0) {
      commands.push(this.createCommand(stack.pop()!));
    }
    
    return commands;
  }

  private getPrecedence(operator: string): number {
    switch (operator) {
      case '!': return 3;
      case '&&': return 2;
      case '||': return 1;
      default: return 0;
    }
  }

  private createCommand(operator: string): string {
    switch (operator) {
      case '&&':
        return 'execute if score #LAST_RESULT temp matches 1 run';
      case '||':
        return 'execute unless score #LAST_RESULT temp matches 1 run';
      case '!':
        return 'execute store success score #LAST_RESULT temp if score #LAST_RESULT temp matches 0';
      default:
        return '';
    }
  }
} 