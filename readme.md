# Development

use `npm run build` to compile TypeScript

use `node dist/inj.js` to test command line functionality

# Before using

use `npm link` to link the project to the global environment

then you can use the `inj` command in the command line

# Usage

## Syntax

The concept of INJ is to introduce new and useful features into the original Minecraft functions. With INJ, you can directly write JavaScript code between lines of Minecraft code in mcfunction files.

### if

You can use `if` to add conditions to your code. The condition is in pure JS syntax. For Minecraft conditions, write it as a JS string like `"block ~ ~ ~ minecraft:air"`, `"score @r inj_score = 3"`, etc.

There are three types of conditions format:

1. `if (<minecraft_condition>) {}`
2. `if (<js_condition>) {}`
3. `if (<minecraft_condition>.and(<js_condition>)) {}`

Tips: the `and()` above can also be `or()`;

Besides the conditions part, all the syntax of `if` are the same as JS code.

Some examples:

```
if ("block ~ ~ ~ minecraft:stone") {
    tellraw @s ["Here is a stone"]
} else {
    tellraw @s ["Here is not a stone"]
}
```

```
if ("block ~ ~ ~ minecraft:stone".and(1 != 2)) {
    tellraw @s ["Here is a stone and 1 is not equal to 2"]
}
```