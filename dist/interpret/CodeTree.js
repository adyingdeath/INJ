import randomCode from "../util/randomCode.js";
import fs from "fs";
import path from "path";
var SnippetType;
(function (SnippetType) {
    SnippetType[SnippetType["RAW"] = 0] = "RAW";
    SnippetType[SnippetType["MC"] = 1] = "MC";
    SnippetType[SnippetType["INJ"] = 2] = "INJ";
})(SnippetType || (SnippetType = {}));
export default class CodeTree {
    root;
    constructor(filename, code) {
        this.root = {};
        const baseDir = path.dirname(filename);
        this.scanDirectory(baseDir);
        const namespace = path.basename(baseDir);
        if (!this.root[namespace]) {
            this.root[namespace] = [];
        }
        this.root[namespace].push({
            id: randomCode(8),
            filename: filename,
            type: SnippetType.RAW,
            code: code,
            next: null
        });
        this.cut();
    }
    scanDirectory(directory) {
        const items = fs.readdirSync(directory);
        const namespace = path.basename(directory);
        if (items.includes('functions')) {
            const functionsPath = path.join(directory, 'functions');
            if (!this.root[namespace]) {
                this.root[namespace] = [];
            }
            this.scanFunctionsDirectory(functionsPath, namespace);
        }
        for (const item of items) {
            const fullPath = path.join(directory, item);
            if (fs.statSync(fullPath).isDirectory() && item !== 'functions') {
                this.scanDirectory(fullPath);
            }
        }
    }
    scanFunctionsDirectory(directory, namespace) {
        const items = fs.readdirSync(directory);
        for (const item of items) {
            const fullPath = path.join(directory, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                this.scanFunctionsDirectory(fullPath, namespace);
            }
            else if (item.endsWith('.mcfunction')) {
                const code = fs.readFileSync(fullPath, 'utf-8');
                this.root[namespace].push({
                    id: randomCode(8),
                    filename: fullPath,
                    type: SnippetType.MC,
                    code: code,
                    next: null
                });
            }
        }
    }
    cut() {
        for (const namespace in this.root) {
            const snippets = this.root[namespace];
            const newSnippets = [];
            for (const snippet of snippets) {
                if (snippet.type !== SnippetType.RAW) {
                    newSnippets.push(snippet);
                    continue;
                }
                const lines = snippet.code.split('\n');
                let currentCode = '';
                let isInInjBlock = false;
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine === '=') {
                        if (currentCode) {
                            newSnippets.push({
                                id: randomCode(8),
                                filename: snippet.filename,
                                type: isInInjBlock ? SnippetType.INJ : SnippetType.MC,
                                code: currentCode.trim(),
                                next: null
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
                    newSnippets.push({
                        id: randomCode(8),
                        filename: snippet.filename,
                        type: isInInjBlock ? SnippetType.INJ : SnippetType.MC,
                        code: currentCode.trim(),
                        next: null
                    });
                }
            }
            this.root[namespace] = newSnippets;
        }
    }
}
//# sourceMappingURL=CodeTree.js.map