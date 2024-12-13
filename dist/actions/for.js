import randomCode from "../util/randomCode.js";
export function forHandler(snippets, command) {
    const currentSnippet = snippets[snippets.length - 1];
    const functionId = randomCode(8);
    const newFunctionPath = `${currentSnippet.filename}/inj/${functionId}`;
    const [variable, , arrayStr] = command.parameters.split(/\s+/);
    const array = eval(arrayStr);
    let loopBody = '';
    array.forEach((value) => {
        loopBody += command.block.replace(new RegExp(`<${variable}>`, 'g'), value.toString()) + '\n';
    });
    const functionSnippet = {
        id: randomCode(8),
        filename: newFunctionPath,
        type: currentSnippet.type,
        code: loopBody.trim()
    };
    currentSnippet.code = `function ${newFunctionPath}`;
    return [...snippets.slice(0, -1), currentSnippet, functionSnippet];
}
//# sourceMappingURL=for.js.map