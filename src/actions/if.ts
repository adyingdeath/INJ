import { Snippet } from "../interpret/CodeTree.js";
import CommandTree from "../interpret/CommandTree.js";
import randomCode from "../util/randomCode.js";

export function ifHandler(snippets: Snippet[], command: CommandTree): Snippet[] {
    // 获取当前正在处理的主snippet
    const currentSnippet = snippets[snippets.length - 1];
    const functionId = randomCode(8);
    const newFunctionPath = `${currentSnippet.filename}/inj/${functionId}`;
    
    // 创建新的函数片段
    const functionSnippet: Snippet = {
        id: randomCode(8),
        filename: newFunctionPath,
        type: currentSnippet.type,
        code: command.block
    };

    // 更新主snippet的代码
    currentSnippet.code = `execute if ${command.parameters} run function ${newFunctionPath}`;

    return [...snippets.slice(0, -1), currentSnippet, functionSnippet];
} 