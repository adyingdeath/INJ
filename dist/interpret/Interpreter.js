export class Interpreter {
    actions;
    constructor() {
        this.actions = new Map();
        Object.entries(defaultActions).forEach(([name, handler]) => {
            this.registerAction(name, handler);
        });
    }
    registerAction(name, handler) {
        this.actions.set(name, handler);
    }
    parse(input) {
        const lines = input.code.split(/\r?\n/);
        const result = [];
        const pattern = /^[a-zA-Z0-9]+:/;
        let currentNode = null;
        let blockLines = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line)
                continue;
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
            }
            else {
                blockLines.push(line);
            }
        }
        if (currentNode) {
            currentNode.block = blockLines.join('\n');
            result.push(currentNode);
        }
        let snippets = [input];
        for (const node of result) {
            const handler = this.actions.get(node.action);
            if (!handler) {
                throw new Error(`未找到动作处理器: ${node.action}`);
            }
            snippets = handler(snippets, node);
        }
        return snippets;
    }
    execute(input) {
        return this.parse(input);
    }
}
//# sourceMappingURL=Interpreter.js.map