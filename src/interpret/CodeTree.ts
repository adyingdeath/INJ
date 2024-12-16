import randomCode from "../util/randomCode.js";
import fs from "fs";
import path from "path";

enum SnippetType {
    RAW,
    MC,
    INJ,
}

export interface Snippet {
    id: string;
    filename: string;
    type: SnippetType;
    code: string;
    next: Snippet | null;
}

interface CodeTreeRoot {
    [namespace: string]: Snippet[];
}

export default class CodeTree {
    private root: CodeTreeRoot;

    constructor(filename: string, code: string) {
        this.root = {};
        
        // 获取文件所在目录
        const baseDir = path.dirname(filename);
        
        // 扫描目录
        this.scanDirectory(baseDir);
        
        // 添加原始代码片段
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

        // 切割代码
        this.cut();
    }

    /**
     * 递归扫描目录，查找并处理 .mcfunction 文件
     */
    private scanDirectory(directory: string) {
        const items = fs.readdirSync(directory);
        
        // 获取当前目录的命名空间（文件夹名）
        const namespace = path.basename(directory);
        
        // 检查是否存在 functions 文件夹
        if (items.includes('functions')) {
            const functionsPath = path.join(directory, 'functions');
            if (!this.root[namespace]) {
                this.root[namespace] = [];
            }
            this.scanFunctionsDirectory(functionsPath, namespace);
        }
        
        // 递归扫描子目录
        for (const item of items) {
            const fullPath = path.join(directory, item);
            if (fs.statSync(fullPath).isDirectory() && item !== 'functions') {
                this.scanDirectory(fullPath);
            }
        }
    }

    /**
     * 递归扫描 functions 目录，处理所有 .mcfunction 文件
     */
    private scanFunctionsDirectory(directory: string, namespace: string) {
        const items = fs.readdirSync(directory);
        
        for (const item of items) {
            const fullPath = path.join(directory, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // 递归扫描子目录
                this.scanFunctionsDirectory(fullPath, namespace);
            } else if (item.endsWith('.mcfunction')) {
                // 读取并处理 .mcfunction 文件
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

    /**
     * Cut the original code snippet into multiple parts based on "="
     * Each block of code surrounded by "=" will be of type INJ,
     * while other code will be of type MC.
     */
    cut() {
        // 遍历所有命名空间
        for (const namespace in this.root) {
            const snippets = this.root[namespace];
            const newSnippets: Snippet[] = [];

            // 只处理 RAW 类型的代码片段
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
                    } else if (trimmedLine) {
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