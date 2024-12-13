import { Snippet } from "../interpret/CodeTree.js";
import CommandTree from "../interpret/CommandTree.js";
import randomCode from "../util/randomCode.js";

export function forHandler(snippets: Snippet[], command: CommandTree): Snippet[] {
    // 获取当前正在处理的主snippet
    const currentSnippet = snippets[snippets.length - 1];
    const functionId = randomCode(8);
    const newFunctionPath = `${currentSnippet.filename}/inj/${functionId}`;
    
    // 解析参数 "i in [0,1,2,3]"
    const [variable, , arrayStr] = command.parameters.split(/\s+/);
    const array = eval(arrayStr);
    
    // 创建循环体函数
    let loopBody = '';
    array.forEach((value: any) => {
        loopBody += command.block.replace(
            new RegExp(`<${variable}>`, 'g'), 
            value.toString()
        ) + '\n';
    });

    // 创建新的函数片段
    const functionSnippet: Snippet = {
        id: randomCode(8),
        filename: newFunctionPath,
        type: currentSnippet.type,
        code: loopBody.trim()
    };

    // 更新主snippet的代码
    currentSnippet.code = `function ${newFunctionPath}`;

    return [...snippets.slice(0, -1), currentSnippet, functionSnippet];
} 