# Language Links

- [English](#development)
- [中文](#开发说明)

# Development

Use `npm run build` to compile TypeScript.

Use `node dist/inj.js` to test the command line functionality. This works the same way as using the `inj` command directly in your terminal.

# Getting Started

- First, install [Node.js](https://nodejs.org/en/download/prebuilt-installer) - this is the runtime environment required for INJ.
- Navigate to the INJ root directory (where `package.json` is located) and run `npm install` in your terminal to install all the dependencies INJ needs.
- After installing, add the INJ root directory to your PATH environment variable.
- Now, you can use the `inj` command from any directory in your terminal.

# Usage

While INJ's syntax includes JavaScript elements, you can still use it effectively even with minimal JavaScript knowledge. However, we recommend familiarizing yourself with some basic JS concepts. At minimum, it's helpful to understand:

- [if statements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else), [while loops](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/while), and [for loops](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for)
- [let declarations](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let)
- [Template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)

These basic concepts will allow you to accomplish a lot with INJ. If you want to unlock its full potential, you can learn more at [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript).

## Syntax

INJ enhances Minecraft functions by introducing powerful new features. It allows you to write JavaScript code directly alongside your Minecraft commands in mcfunction files.

### INJ.run

The special function `INJ.run(minecraft_command: string)` executes Minecraft commands at the specified position. This is particularly useful for incorporating JavaScript variables into your Minecraft commands. For example:

```
for (let i = 0; i < 10; i++) {
    INJ.run(`setblock ~${i} ~ ~${i} minecraft:stone`);
}
```

![](./example/assets/line.png)

You can also use more complex JavaScript expressions within the template literals:

```
// Create a circle of arrows with radius 10
const radius = 10;
for (let i = 0; i < 100; i++) {
    INJ.run(`summon minecraft:arrow ~${(Math.cos(i / 100 * 2 * Math.PI) * radius).toFixed(2)} ~ ~${(Math.sin(i / 100 * 2 * Math.PI) * radius).toFixed(2)}`);
}
```

- x coordinate: `(Math.cos(i / 100 * 2 * Math.PI) * radius).toFixed(2)`
- y coordinate: `(Math.sin(i / 100 * 2 * Math.PI) * radius).toFixed(2)`

The `toFixed(2)` method is used to round the numbers to two decimal places.

![](./example/assets/arrow_circle.png)

### if Statements

You can use `if` statements to add conditional logic to your code. The conditions can be written in pure JavaScript syntax. For Minecraft-specific conditions, write them as JavaScript strings, such as `"block ~ ~ ~ minecraft:air"` or `"score @r inj_score = 3"`.

There are three ways to write conditions:

1. `if (<minecraft_condition>) {}`
2. `if (<js_condition>) {}`
3. `if (<minecraft_condition>.and(<js_condition>)) {}`

Note: You can use either `and()` or `or()` to combine conditions.

The rest of the `if` statement syntax follows standard JavaScript conventions.

Examples:

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

### while Loops

Currently, `while` loops only support JavaScript conditions, not Minecraft conditions.

```
let i = 0;
while (i % 2 == 0 && i < 10) {
    tellraw @a "Hello World!"
}
```

## Command Line

```
Usage: inj [options] <directory>

Compiler for your project

Arguments:
  directory            source directory

Options:
  -V, --version        output the version number
  -o, --output <path>  output path
  -w, --watch          watch mode
  -h, --help           display help for command
```

The source directory is where you save your source code, whose structure is as follows:

```
src
├─<your_namespace>
│  ├─advancements
│  ├─functions
│  │  ├─test.mcfunction
│  │  └─hello.mcfunction
│  ├─loot_tables
│  ├─recipes
│  └─tags
└─minecraft
    ├─dimension
    ├─dimension_type
    ├─loot_tables
    └─tags
```

It is actually the same as the structure of `data` folder in a Minecraft datapack.

---

# 开发说明

使用 `npm run build` 编译 TypeScript 代码。

使用 `node dist/inj.js` 测试命令行功能，效果与直接在终端使用 `inj` 命令相同。

# 使用前准备

- 首先安装 [Node.js](https://nodejs.org/en/download/prebuilt-installer)，这是运行 INJ 所需的环境。
- 进入 INJ 源代码目录（即 `package.json` 所在目录），在终端中运行 `npm link` 将项目链接到全局环境。
- 完成链接后，你就可以在任意目录的终端中使用 `inj` 命令了。

# 使用说明

虽然 INJ 的语法包含 JavaScript 元素，但即使你不熟悉 JS 也可以有效地使用它。不过，我们建议你了解一些基本的 JS 概念。至少应该掌握：

- [if 语句](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else)、[while 循环](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/while)和 [for 循环](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for)
- [let 声明](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let)
- [模板字符串](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)

掌握这些基本概念就能让你充分利用 INJ 的大部分功能。如果想要发挥 INJ 的全部潜力，可以在 [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript) 学习更多内容。

## 语法

INJ 通过引入强大的新特性来增强 Minecraft 函数的功能。它允许你在 mcfunction 文件中直接编写 JavaScript 代码。

### INJ.run

特殊函数 `INJ.run(minecraft_command: string)` 用于在指定位置执行 Minecraft 命令。这个功能特别适合将 JavaScript 变量整合到 Minecraft 命令中。例如：

```
for (let i = 0; i < 10; i++) {
    INJ.run(`setblock ~${i} ~ ~${i} minecraft:stone`);
}
```

![](./example/assets/line.png)

你还可以在模板字符串中使用更复杂的 JavaScript 表达式：

```
// 创建一个半径为10的箭矢圆
const radius = 10;
for (let i = 0; i < 100; i++) {
    INJ.run(`summon minecraft:arrow ~${(Math.cos(i / 100 * 2 * Math.PI) * radius).toFixed(2)} ~ ~${(Math.sin(i / 100 * 2 * Math.PI) * radius).toFixed(2)}`);
}
```

- x 坐标：`(Math.cos(i / 100 * 2 * Math.PI) * radius).toFixed(2)`
- y 坐标：`(Math.sin(i / 100 * 2 * Math.PI) * radius).toFixed(2)`

这里的 `toFixed(2)` 用于将数字四舍五入到两位小数。

![](./example/assets/arrow_circle.png)

### if 语句

你可以使用 `if` 语句为代码添加条件逻辑。条件可以用纯 JavaScript 语法编写。对于 Minecraft 特定的条件，将它们写成 JavaScript 字符串，如 `"block ~ ~ ~ minecraft:air"` 或 `"score @r inj_score = 3"`。

条件编写有三种方式：

1. `if (<minecraft_condition>) {}`
2. `if (<js_condition>) {}`
3. `if (<minecraft_condition>.and(<js_condition>)) {}`

注意：你可以使用 `and()` 或 `or()` 来组合条件。

`if` 语句的其余语法遵循标准 JavaScript 约定。

示例：

```
if ("block ~ ~ ~ minecraft:stone") {
    tellraw @s ["这里有一块石头"]
} else {
    tellraw @s ["这里不是石头"]
}
```

```
if ("block ~ ~ ~ minecraft:stone".and(1 != 2)) {
    tellraw @s ["这里有一块石头，并且1不等于2"]
}
```

### while 循环

目前，`while` 循环只支持 JavaScript 条件，不支持 Minecraft 条件。

```
let i = 0;
while (i % 2 == 0 && i < 10) {
    tellraw @a "Hello World!"
}
```

## 命令行

```
使用: inj [选项] <目录>

编译你的项目

参数:
  <目录>                源文件夹

选项:
  -V, --version        输出版本号
  -o, --output <path>  输出路径
  -w, --watch          监听模式
  -h, --help           显示帮助信息
```

源代码目录是保存你的源代码的目录，其结构如下：

```
src
├─<your_namespace>
│  ├─advancements
│  ├─functions
│  │  ├─test.mcfunction
│  │  └─hello.mcfunction
│  ├─loot_tables
│  ├─recipes
│  └─tags
└─minecraft
    ├─dimension
    ├─dimension_type
    ├─loot_tables
    └─tags
```

它实际上与 Minecraft 数据包中的 `data` 文件夹的结构相同。
