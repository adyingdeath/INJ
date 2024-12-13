import randomCode from "../util/randomCode.js";
import fs from "fs";
var SnippetType;
(function (SnippetType) {
    SnippetType[SnippetType["RAW"] = 0] = "RAW";
    SnippetType[SnippetType["MC"] = 1] = "MC";
    SnippetType[SnippetType["INJ"] = 2] = "INJ";
})(SnippetType || (SnippetType = {}));
export default class CodeTree {
    snippet;
    constructor(filename, code) {
        this.snippet = [{
                id: randomCode(8),
                filename: filename,
                type: SnippetType.RAW,
                code: code
            }];
        this.cut();
    }
    cut() {
        const result = [];
        const lines = this.snippet[0].code.split('\n');
        let currentCode = '';
        let isInInjBlock = false;
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine === '=') {
                if (currentCode) {
                    result.push({
                        id: randomCode(8),
                        filename: this.snippet[0].filename,
                        type: isInInjBlock ? SnippetType.INJ : SnippetType.MC,
                        code: currentCode.trim()
                    });
                    currentCode = '';
                }
                isInInjBlock = !isInInjBlock;
            }
            else if (trimmedLine) {
                currentCode += line + '\n';
            }
        }
        if (currentCode) {
            result.push({
                id: randomCode(8),
                filename: this.snippet[0].filename,
                type: isInInjBlock ? SnippetType.INJ : SnippetType.MC,
                code: currentCode.trim()
            });
        }
        this.snippet = result;
        console.log(this.snippet);
    }
}
new CodeTree("123", fs.readFileSync("./test.mcfunction").toString());
//# sourceMappingURL=CodeTree.js.map