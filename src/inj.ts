import minimist from "minimist";
import CodeTree from "./compile/CodeTree.js";
import { Compiler } from "./compile/Compiler.js";
import { Lexer } from "./compile/Lexer.js";
import fs from "fs";
import { Parser } from "./compile/Parser.js";
import { SemanticAnalyzer } from "./compile/SemanticAnalyzer.js";

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


/* const codeTree = new CodeTree("D:/Program Files/minecraft/hmcl/.minecraft/versions/1.20.1/saves/Growing Command/datapacks/GC/src")

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
}); */

let tokens = new Lexer(`execute as @s run function gc:test
execute as @s run function gc:test
if("block ~ ~ ~ stone") {
	say 1
}else{
	tellraw @a "Hello World"
}
add();
for(let i of [1,2,3,4]) {
	while(1 || a == 1 && "block ~ ~ ~ stone") {
        let i = 1;
		say 1
	}
	setblock ~ ~ ~ stone
}
execute as @s run function gc:gogo`).scanTokens();

console.log(tokens);

let program = new Parser(tokens).parse();

console.dir(program, {
    depth: null
});

let err = new SemanticAnalyzer().analyze(program);

console.log(err);