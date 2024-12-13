import { Snippet } from './CodeTree.js';
export declare class Interpreter {
    private actions;
    constructor();
    registerAction(name: string, handler: Function): void;
    parse(input: Snippet): Snippet[];
    execute(input: Snippet): Snippet[];
}
