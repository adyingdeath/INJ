import { SnippetType } from "./compile/CodeTree.js";
import { Transformer } from "./compile/Transformer.js";

import { Parser } from "acorn";

/* let source = `execute as @s run function gc:test
execute as @s run function gc:test
if("".and(a != 1)) {
	say 1
    if(1 == 1) {
        tellraw @a "123"
    }
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
execute as @s run function gc:gogo`; */

let source = `if(('A' && 1)) {
	say 1
}`;

let code = new Transformer().transform(source);

console.log(code);

let ast = Parser.parse(code, {
    ecmaVersion: 6,
    sourceType: "module"
});

console.dir(ast, {depth:null});
