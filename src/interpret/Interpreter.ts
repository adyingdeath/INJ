import CommandTree from './CommandTree.js';
import * as defaultActions from '../actions/default.js';
import { Snippet } from './CodeTree.js';

export class Interpreter {
    private actions: Map<string, Function>;

    constructor() {
        this.actions = new Map();
        // 注册默认动作
        Object.entries(defaultActions).forEach(([name, handler]) => {
            this.registerAction(name, handler);
        });
    }

    registerAction(name: string, handler: Function) {
        this.actions.set(name, handler);
    }

    parse(input: Snippet): Snippet[] {
        const lines = input.code.split(/\r?\n/);
        const result: CommandTree[] = [];
        const pattern = /^[a-zA-Z0-9]+:/;
        let currentNode: CommandTree | null = null;
        let blockLines: string[] = [];

        // 解析代码为CommandTree结构
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            if (pattern.test(line)) {
                if (currentNode) {
                    currentNode.block = blockLines.join('\n');
                    result.push(currentNode);
                    blockLines = [];
                }

                const [action, ...paramParts] = line.split(':');
                const parameters = paramParts.join(':').trim();
                
                currentNode = {
                    action: action.trim(),
                    parameters,
                    block: ''
                };
            } else {
                blockLines.push(line);
            }
        }

        if (currentNode) {
            currentNode.block = blockLines.join('\n');
            result.push(currentNode);
        }

        // 让每个action处理器处理自己的命令
        let snippets: Snippet[] = [input];
        for (const node of result) {
            const handler = this.actions.get(node.action);
            if (!handler) {
                throw new Error(`未找到动作处理器: ${node.action}`);
            }
            // 每个处理器接收当前的snippets数组和当前的命令节点，返回处理后的新snippets数组
            snippets = handler(snippets, node);
        }

        return snippets;
    }

    execute(input: Snippet) {
        return this.parse(input);
    }
}
