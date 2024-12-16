export declare class Actions {
    private conditionParser;
    constructor();
    handleIf(condition: string, body: string[]): string[];
    handleWhile(condition: string, body: string[]): string[];
}
