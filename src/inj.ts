import minimist from "minimist";
import CodeTree from "./interpret/CodeTree.js";
import { Interpreter } from "./interpret/Interpreter.js";

const args = minimist(process.argv.slice(2));

console.log(args);

class INJ {
    constructor() {
        // 构造函数内容
    }

    /**
     * Process the source code containing INJ code
     * @param {string} source - source code with INJ code in it.
     * @returns {string} mcfunction code
     */
    process(source: string): string {
        return ''; // 临时返回空字符串，等待实现
    }
}


const codeTree = new CodeTree("D:/Program Files/minecraft/hmcl/.minecraft/versions/1.20.1/saves/Growing Command/datapacks/GC/src")
console.dir(codeTree, { 
    depth: null,
    colors: true,
    showHidden: true 
});
new Interpreter().interpret(codeTree);
console.dir(codeTree, { 
    depth: null,
    colors: true,
    showHidden: true 
});