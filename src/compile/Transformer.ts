import * as babel from '@babel/core';
import forCondition from './transform/forCondition.js';
import { ImportConstraint } from './CodeTree.js';
import { ExportConstraint } from './CodeTree.js';

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

const MINECRAFT_PATTERNS = {
    namespace: /^[a-z0-9_\-\.]+$/,
    nameAfterNamespace: /^[a-z0-9_\-\.\/]+$/,
    commandName: /^[a-z][a-z0-9]*$/,
    returnValue: /^[+\-]?\d+$/
};

export class Transformer {
    private ioObject: {
        imports: ImportConstraint[];
        exports: ExportConstraint[];
    } = {
        imports: [],
        exports: []
    }
    /* Whether we are in the header zone
    *  Header zone is at the beginning of the file, containing some special commands.
    *  Special commands format:
    *  ;;<command>;<args>;<args>...
    */
    private isHeaderZone: boolean = true;

    /**
     * Transform code into valid JavaScript
     * @param code Input code (single or multiple lines)
     * @returns Transformed code
     */
    transform(code: string): { code: string; imports: ImportConstraint[]; exports: ExportConstraint[]; } {
        // At the beginning of the file, we are in the header zone
        this.isHeaderZone = true;
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
            sourceType: 'module'
        });
        const returnObject = {
            code: (result && result.code) ? result.code : "",
            imports: this.ioObject.imports,
            exports: this.ioObject.exports
        }
        return returnObject;
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
        if (trimmedLine.length === 0) {
            return line;
        }

        // Special commands on the beginning of the file
        if (this.isHeaderZone && trimmedLine.startsWith(";;")) {
            const command = trimmedLine.slice(2).split(";");
            switch (command[0]) {
                case "import": {
                    this.ioObject.imports.push({
                        target: command[1],
                        name: command[2]
                    });
                    break;
                }
                case "export": {
                    this.ioObject.exports.push({
                        target: command[1],
                        name: command[2]
                    });
                    break;
                }
            }
            return "";
        }

        // Meet some lines which are not the format of Header Zone
        this.isHeaderZone = false;

        // Rule 1: Skip if ends with semicolon
        if (trimmedLine.endsWith(';')) {
            return line;
        }

        // Rule 2: Skip if starts with // or #
        if (trimmedLine.startsWith("//") || trimmedLine.startsWith("#")) {
            return "";
        }

        /* Rule 3: Check if it might be a Minecraft command
        *  If it is, wrap it with $()
        *  We will treat those uncleared lines as JS code
        */
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
        const segments = line.split(" ");
        if (!MinecraftCommandList.includes(segments[0])) return false;
        switch (segments[0]) {
            case "function": {
                if (segments.length === 1) return false;
                const [left, right, more] = segments[1].split(":");
                // check if right is not empty
                if (more) return false;
                // check if "namespace:name"
                if (MINECRAFT_PATTERNS.namespace.test(left) && MINECRAFT_PATTERNS.nameAfterNamespace.test(right)) return true;
                // check if "name"
                if (MINECRAFT_PATTERNS.nameAfterNamespace.test(left)) return true;
                return false;
            }
            case "return": {
                if (segments.length === 1) return false;
                if (segments[1] === "fail") {
                    /* Format: return fail
                    *  So there should be only 2 segments
                    */
                    if (segments.length != 2) return false;
                } else if (segments[1] === "run") {
                    /* Format: return run <command>
                    *  So there should be at least 3 segments and the third one should be a valid command name
                    */
                    if (segments.length < 3) return false;
                    if (!MINECRAFT_PATTERNS.commandName.test(segments[2])) return false;
                } else {
                    /* Format: return <value>
                    * <value> should be a valid integer
                    */
                    if (!MINECRAFT_PATTERNS.returnValue.test(segments[1])) return false;
                }
            }
        }
        return true;
    }

    /**
     * Wrap a line with $()
     */
    private wrapWithExecute(line: string): string {
        // Preserve original indentation
        const indentation = line.match(/^\s*/)?.[0] || '';
        const trimmedLine = line.trim();
        return `${indentation}$(\`${trimmedLine.replace(/`/g, "\\`")}\`)`;
    }
}
