import vm from 'node:vm';
import { Transformer } from './Transformer.js';
import CodeTree, { ImportConstraint, Snippet } from './CodeTree.js';
import randomCode from '../util/randomCode.js';


async function importModule(imports: ImportConstraint[]): Promise<any[]> {
    return Promise.all(imports.map(async (i) => await import(i.target)));
}

class INJContext {
    public codeTree: CodeTree;
    public current: Snippet;
    public imports: any[];

    constructor(codeTree: CodeTree, current: Snippet, imports: any[]) {
        this.codeTree = codeTree;
        this.current = current;
        this.imports = imports;
    }

    INJ = {
        $: (cmd: string) => {
            this.current.code += cmd + "\n";
        },
        jump: (conditions: string, callback: () => string) => {
            let id = randomCode(8);
    
            let node: Snippet = {
                namespace: "inj",
                filename: `${id}`,
                code: ""
            }
    
            this.codeTree.root["inj"].snippets.push(node);
            this.current.code += `execute as @s ${conditions} run function inj:${node.filename}\n`;

            const inj = new INJContext(this.codeTree, node, this.imports);
            
            // Create a new context with module options
            const vmContext = vm.createContext({
                INJ: inj.INJ,
                $: inj.INJ.$,
                console: console,
                ...this.imports
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
    private codeTree: CodeTree;
    private transformer: Transformer;

    constructor(codeTree: CodeTree) {
        this.codeTree = codeTree;
        this.transformer = new Transformer(codeTree);
    }

    /**
     * Main compile method for processing the entire code tree
     * @param tree CodeTree to compile
     */
    async compile(): Promise<void> {
        for (const namespace in this.codeTree.root) {
            for (const snippet of this.codeTree.root[namespace].snippets) {
                const code = snippet.code;
                snippet.code = "";
                await this.compileSnippet(snippet, code);
            }
        }
    }

    /**
     * Internal method to compile individual snippets
     * @param tree CodeTree context
     * @param current Current snippet being processed
     * @param code Raw code to compile
     */
    private async compileSnippet(current: Snippet, code: string): Promise<void> {
        try {
            const transformed = this.transformer.transform(code, current);

            // Dynamically import modules
            const imports = await importModule(transformed.imports);
            const importsObject: { [key: string]: any } = {};
            for (let i = 0; i < imports.length; i++) {
                importsObject[transformed.imports[i].name as string] = imports[i];
            }

            const context = new INJContext(this.codeTree, current, imports);
            
            // Create a new context with module options
            const vmContext = vm.createContext({
                INJ: context.INJ,
                $: context.INJ.$,
                console: console,
                ...importsObject
            });

            // Run the code with module support
            vm.runInContext(transformed.code, vmContext);
        } catch (error) {
            throw error;
        }
    }
}
