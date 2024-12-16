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
    next: Snippet | null;
}
export default class CodeTree {
    private root;
    constructor(filename: string, code: string);
    private scanDirectory;
    private scanFunctionsDirectory;
    cut(): void;
}
export {};
