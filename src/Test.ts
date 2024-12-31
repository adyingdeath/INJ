import ivm from 'isolated-vm';
import CodeTree from "./compile/CodeTree.js";
import { Compiler } from "./compile/Compiler.js";
import { Transformer } from "./compile/Transformer.js";

(async () => {
    const tree = new CodeTree("D:/Program Files/minecraft/hmcl/.minecraft/versions/1.20.1/saves/Growing Command/datapacks/chainblock/src")

    //const code = new Transformer().transform(tree.root.gc[0].code);

    const compiler = new Compiler(tree);
    await compiler.compile();
    console.dir(tree, { depth: null });
})();

/* const inj = {
    go: 1,
    test: new ivm.Callback((...args: any[]) => {
        return "go";
    })
};

(async () => {
    const isolate = new ivm.Isolate();
    const context = await isolate.createContext();
    const jail = context.global;

    // Set up the global object in the new context
    await jail.set('global', jail.derefInto());
    await jail.set('inj', new ivm.Reference(inj));
    await jail.set('injtest', new ivm.Callback((...args: any[]) => {
        return "go";
    }));

    const script = await isolate.compileScript(`
        injtest();
        //inj.test();
    `);

    const result = await script.run(context);
    console.log(result);
})(); */
