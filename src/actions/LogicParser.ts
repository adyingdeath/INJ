/**
 * 处理逻辑表达式的解析器
 */
export class LogicParser {
  /**
   * 解析逻辑表达式
   * @param expression 逻辑表达式
   * @returns 处理后的命令列表
   */
  parse(expression: string): string[] {
    const commands: string[] = [];
    
    // 初始化结果记分板
    commands.push('scoreboard objectives add temp dummy');
    commands.push('scoreboard players set #LAST_RESULT temp 0');
    
    // 解析表达式
    const tokens = this.tokenize(expression);
    commands.push(...this.buildCommands(tokens));
    
    return commands;
  }

  private tokenize(expression: string): string[] {
    const tokens: string[] = [];
    let current = '';
    
    for (let i = 0; i < expression.length; i++) {
      const char = expression[i];
      
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
        if (expression[i + 1] === char) {
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

  private buildCommands(tokens: string[]): string[] {
    const commands: string[] = [];
    const stack: string[] = [];
    
    for (const token of tokens) {
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
        commands.push(`execute store success score #LAST_RESULT temp ${token}`);
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