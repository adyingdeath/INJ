import vm from 'node:vm';
import { Transformer } from './Transformer.js';
import CodeTree, { Snippet } from './CodeTree.js';
import randomCode from '../util/randomCode.js';

class INJContext {
    public codeTree: CodeTree;
    public current: Snippet;

    constructor(codeTree: CodeTree, current: Snippet) {
        this.codeTree = codeTree;
        this.current = current;
    }

    INJ = {
        execute: (cmd: string) => {
            this.current.code += cmd + "\n";
        },
        jump: (conditions: string, callback: () => string) => {
            let id = randomCode(8);
    
            let node: Snippet = {
                id: id,
                namespace: "inj",
                filename: `${id}`,
                code: "",
            }
    
            this.codeTree.root["inj"].push(node);
            this.current.code += `execute ${conditions} run function inj:${node.filename}\n`;

            const inj = new INJContext(this.codeTree, node)
            
            // Create a new context with module options
            const vmContext = vm.createContext({
                INJ: inj.INJ,
                console: console,
            });

            vm.runInContext(`(${callback.toString()})();`, vmContext);
        }
    }

    
}

/**
 * Class representing a compiler for Minecraft datapack functions
 * Compiles and executes code using Node's vm module
 */
export class Compiler {
    private transformer: Transformer;

    constructor() {
        this.transformer = new Transformer();
    }

    /**
     * Main compile method for processing the entire code tree
     * @param tree CodeTree to compile
     */
    async compile(tree: CodeTree): Promise<void> {
        for (const namespace in tree.root) {
            for (const snippet of tree.root[namespace]) {
                const code = snippet.code;
                snippet.code = "";
                await this.compileSnippet(tree, snippet, code);
            }
        }
    }

    /**
     * Internal method to compile individual snippets
     * @param tree CodeTree context
     * @param current Current snippet being processed
     * @param code Raw code to compile
     */
    private async compileSnippet(tree: CodeTree, current: Snippet, code: string): Promise<void> {
        try {
            console.log(1);
            const transformedCode = this.transformer.transform(code);
            const context = new INJContext(tree, current);
            
            // Create a new context with module options
            const vmContext = vm.createContext({
                INJ: context.INJ,
                console: console,
            });

            // Run the code with module support
            vm.runInContext(transformedCode, vmContext);
        } catch (error) {
            console.error('Compilation error:', error);
            throw error;
        }
    }
}
