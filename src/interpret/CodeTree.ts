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
    public root: CodeTreeRoot;

    constructor(filename: string) {
        this.root = {};
        // 只扫描根目录下的直接子文件夹
        const items = fs.readdirSync(filename);
        for (const item of items) {
            const fullPath = path.join(filename, item);
            if (fs.statSync(fullPath).isDirectory()) {
                this.scanNamespace(fullPath);
            }
        }
        console.log(this.root);
    }

    /**
     * 扫描命名空间文件夹，只处理其中的 functions 目录
     */
    private scanNamespace(namespacePath: string) {
        const namespace = path.basename(namespacePath);
        const functionsPath = path.join(namespacePath, 'functions');
        
        // 如果存在 functions 目录，则扫描它
        if (fs.existsSync(functionsPath)) {
            this.root[namespace] = [];
            this.scanFunctionsDirectory(functionsPath, namespace, functionsPath);
        }
    }

    /**
     * 递归扫描 functions 目录，处理所有 .mcfunction 文件
     */
    private scanFunctionsDirectory(directory: string, namespace: string, functionsRoot: string) {
        const items = fs.readdirSync(directory);
        
        for (const item of items) {
            const fullPath = path.join(directory, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // 递归扫描子目录
                this.scanFunctionsDirectory(fullPath, namespace, functionsRoot);
            } else if (item.endsWith('.mcfunction')) {
                // 读取并处理 .mcfunction 文件
                const code = fs.readFileSync(fullPath, 'utf-8');
                
                // 计算相对于 functions 目录的路径并移除后缀名
                const relativePath = path.relative(functionsRoot, fullPath);
                const filenameWithoutExt = relativePath.slice(0, -11); // 移除 '.mcfunction' 后缀
                
                this.root[namespace].push({
                    id: randomCode(8),
                    filename: filenameWithoutExt.replace(/\\/g, '/'), // 确保使用正斜杠
                    type: SnippetType.RAW,
                    code: code,
                    next: null
                });
            }
        }
    }
}

new CodeTree("D:/Program Files/minecraft/hmcl/.minecraft/versions/1.20.1/saves/Growing Command/datapacks/GC/src")