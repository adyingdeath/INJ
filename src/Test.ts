import { SnippetType } from "./compile/CodeTree.js";
import { Compiler } from "./compile/Compiler.js";

let source = `execute as @s run function gc:test
execute as @s run function gc:test
if(!(!!!(!"block ~ ~ ~ stone") && !"player @p 1") && a != 1) {
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
execute as @s run function gc:gogo`;

new Compiler().compile({
    type: SnippetType.RAW,
    filename: "test",
    code: source,
    id: "123",
    namespace: "go",
    next: null
});