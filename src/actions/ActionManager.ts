import { Action } from './Action.js';
import { IfAction } from './IfAction.js';
import { WhileAction } from './WhileAction.js';

/**
 * 管理所有Action的类
 */
export class ActionManager {
  private actions: Map<string, Action> = new Map();

  constructor() {
    this.registerDefaultActions();
  }

  /**
   * 注册一个新的Action
   */
  register(name: string, action: Action): void {
    this.actions.set(name.toLowerCase(), action);
  }

  /**
   * 执行指定的Action
   */
  execute(name: string, params: string, body?: string[]): string[] {
    const action = this.actions.get(name.toLowerCase());
    if (!action) {
      throw new Error(`Unknown action: ${name}`);
    }
    return action.execute(params, body);
  }

  private registerDefaultActions(): void {
    this.register('if', new IfAction());
    this.register('while', new WhileAction());
  }
} 