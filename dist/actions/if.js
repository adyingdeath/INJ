import randomCode from "../util/randomCode.js";
export function ifHandler(snippets, command) {
    const currentSnippet = snippets[snippets.length - 1];
    const functionId = randomCode(8);
    const newFunctionPath = `${currentSnippet.filename}/inj/${functionId}`;
    const functionSnippet = {
        id: randomCode(8),
        filename: newFunctionPath,
        type: currentSnippet.type,
        code: command.block
    };
    currentSnippet.code = `execute if ${command.parameters} run function ${newFunctionPath}`;
    return [...snippets.slice(0, -1), currentSnippet, functionSnippet];
}
//# sourceMappingURL=if.js.map