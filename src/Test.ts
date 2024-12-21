import { SnippetType } from "./compile/CodeTree.js";
import { Transformer } from "./compile/Transformer.js";
import forCondition from "./compile/transform/forCondition.js";

import * as babel from '@babel/core';
import generate from '@babel/generator';

(async () => {
    const source = `if((('A' && "B" ) && 1).and()) {
        say 1
    }`;
    
    let code = new Transformer().transform(source);
    
    console.log("Input code:", code);
    
    const result = babel.transformSync(code, {
        presets: ['@babel/preset-env'],
        plugins: [forCondition],
        sourceType: 'module',
        ast: true,
    });
    
    if (result) {
        console.log("Transformed code:", result.code);
    }
})();



