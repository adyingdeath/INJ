import * as babel from '@babel/core';
import forCondition from './transform/forCondition.js';
import path from 'path';

const DeprecatedCommandList = [
    "replaceitem",
    "testfor",
    "testforblock",
    "testforblocks",
    "toggledownfall"
]

const BECommandList = [
    "replaceitem", "testfor", "testforblock", "testforblocks",
    "toggledownfall", "clear", "clone", "damage", "deop", "difficulty",
    "effect", "enchant", "execute", "fill", "function", "gamemode",
    "gamerule", "give", "help", "kick", "kill", "list", "locate",
    "loot", "me", "msg", "op", "particle", "place", "playsound", "recipe",
    "reload", "ride", "say", "schedule", "scoreboard", "setblock",
    "setworldspawn", "spawnpoint", "spreadplayers", "stop", "stopsound",
    "summon", "tag", "teleport", "tell", "tellraw", "time", "title",
    "tp", "transfer", "w", "weather", "whitelist", "xp", "?", "ability",
    "aimassist", "alwaysday", "camera", "camerashake", "changesetting",
    "clearspawnpoint", "connect", "daylock", "dedicatedwsserver", "dialogue",
    "event", "fog", "gametest", "gametips", "hud", "immutableworld",
    "inputpermission", "mobevent", "music", "ops", "permission", "playanimation",
    "reloadconfig", "save", "script", "scriptevent", "set_movement_authority",
    "setmaxplayers", "structure", "tickingarea", "titleraw", "wb", "worldbuilder",
    "wsserver"
]

const JECommandList = [
    "advancement", "attribute", "ban", "ban-ip", "banlist", "bossbar",
    "clear", "clone", "damage", "data", "datapack", "debug",
    "defaultgamemode", "deop", "difficulty", "effect", "enchant",
    "execute", "experience", "fill", "fillbiome", "forceload",
    "function", "gamemode", "gamerule", "give", "help", "item",
    "jfr", "kick", "kill", "list", "locate", "loot", "me", "msg",
    "op", "pardon", "pardon-ip", "particle", "perf", "place",
    "playsound", "publish", "random", "recipe", "reload", "return",
    "ride", "rotate", "save-all", "save-off", "save-on", "say",
    "schedule", "scoreboard", "seed", "setblock", "setidletimeout",
    "setworldspawn", "spawnpoint", "spectate", "spreadplayers", "stop",
    "stopsound", "summon", "tag", "team", "teammsg", "teleport", "tell",
    "tellraw", "tick", "time", "title", "tm", "tp", "transfer", "trigger",
    "w", "warden_spawn_tracker", "weather", "whitelist", "worldborder", "xp"
]

const MinecraftCommandList = Array.from(new Set([...DeprecatedCommandList, ...BECommandList, ...JECommandList]));

export class Transformer {
    /**
     * Transform code into valid JavaScript
     * @param code Input code (single or multiple lines)
     * @returns Transformed code
     */
    transform(code: string): string {
        // Split code into lines and process each line
        const lines = code.split('\n');
        const transformedLines = lines.map(line => this.transformLine(line));
        const result = babel.transformSync(transformedLines.join('\n'), {
            presets: [
                ['@babel/preset-env', {
                    modules: false  // Keep ES modules
                }]
            ],
            plugins: [forCondition],
            sourceType: 'module',
            ast: true
        });
        return (result && result.code) ? result.code : "";
    }

    /**
     * Transform a single line of code
     * @param line Single line of code
     * @returns Transformed line
     */
    private transformLine(line: string): string {
        // Trim the line to remove leading/trailing whitespace
        const trimmedLine = line.trim();

        // Skip empty lines
        if (!trimmedLine) {
            return line;
        }

        // Rule 1: Skip if ends with semicolon
        if (trimmedLine.endsWith(';')) {
            return line;
        }

        // Rule 2: Skip if starts with //
        if (trimmedLine.startsWith("//")) {
            return "";
        }

        // Rule 3: Skip if starts with #
        if (trimmedLine.startsWith("#")) {
            return "";
        }

        // Rule 4: Check if it's a single identifier
        if (this.isSingleIdentifier(trimmedLine)) {
            return this.wrapWithExecute(line);
        }

        // Rule 5: Check if it starts with "identifier space identifier"
        if (this.isMinecraftCommand(trimmedLine)) {
            return this.wrapWithExecute(line);
        }

        // If none of the rules match, return the original line
        return line;
    }

    /**
     * Check if the line is a single identifier
     */
    private isSingleIdentifier(line: string): boolean {
        // Remove all whitespace and check if it contains special characters
        const noWhitespace = line.replace(/\s/g, '');
        return /^[^(){}\[\]<>;"'\s]+$/.test(noWhitespace);
    }

    /**
     * Check if the line starts with two identifiers separated by space
     */
    private isMinecraftCommand(line: string): boolean {
        // Match pattern: identifier + space + identifier
        const pattern = /^[^(){}\[\]<>;"'\s]+\s+[^(){}\[\]<>;"'\s]+/;
        if (!pattern.test(line)) return false;
        if (!MinecraftCommandList.includes(line.split(" ")[0])) return false;
        return true;
    }

    /**
     * Wrap a line with inj.execute()
     */
    private wrapWithExecute(line: string): string {
        // Preserve original indentation
        const indentation = line.match(/^\s*/)?.[0] || '';
        const trimmedLine = line.trim();
        return `${indentation}INJ.run(\`${trimmedLine.replace(/`/g, "\\`")}\`)`;
    }
}
