import { ConditionParser } from './ConditionParser.js';
export class Actions {
    conditionParser;
    constructor() {
        this.conditionParser = new ConditionParser();
    }
    handleIf(condition, body) {
        const commands = [];
        commands.push('scoreboard objectives add temp dummy');
        commands.push('scoreboard players set #LAST_RESULT temp 0');
        const conditionCommands = this.conditionParser.parse(condition);
        commands.push(...conditionCommands);
        commands.push('execute if score #LAST_RESULT temp matches 1 run {');
        commands.push(...body);
        commands.push('}');
        return commands;
    }
    handleWhile(condition, body) {
        const commands = [];
        commands.push('scoreboard objectives add temp dummy');
        const loopLabel = `while_${Math.random().toString(36).substr(2, 9)}`;
        commands.push(`function ${loopLabel}_start`);
        const conditionCommands = this.conditionParser.parse(condition);
        commands.push(`# ${loopLabel}_start.mcfunction:`);
        commands.push('scoreboard players set #LAST_RESULT temp 0');
        commands.push(...conditionCommands);
        commands.push('execute if score #LAST_RESULT temp matches 1 run {');
        commands.push(...body);
        commands.push(`function ${loopLabel}_start`);
        commands.push('}');
        return commands;
    }
}
//# sourceMappingURL=default.js.map