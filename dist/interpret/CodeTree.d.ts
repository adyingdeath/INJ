declare enum SnippetType {
    RAW = 0,
    MC = 1,
    INJ = 2
}
export interface Snippet {
    id: string;
    filename: string;
    type: SnippetType;
    code: string;
}
export default class CodeTree {
    private snippet;
    constructor(filename: string, code: string);
    cut(): void;
}
export {};
