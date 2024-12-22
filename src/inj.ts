#!/usr/bin/env node

import { Command } from "commander";
import path from "path";
import fs from "fs";
import { watch } from "fs/promises";
import CodeTree from "./compile/CodeTree.js";
import { Compiler } from "./compile/Compiler.js";
import { FileMaker } from "./compile/FileMaker.js";

const program = new Command();

program
    .name("inj")
    .description("Compiler for your project")
    .version("1.0.0")
    .argument("<directory>", "source directory")
    .option("-o, --output <path>", "output path")
    .option("-w, --watch", "watch mode")
    .action(async (directory, options) => {
        const sourcePath = path.resolve(process.cwd(), directory);

        if (!fs.existsSync(sourcePath)) {
            console.error(`Error: Path ${sourcePath} does not exist`);
            process.exit(1);
        }

        if (!fs.statSync(sourcePath).isDirectory()) {
            console.error(`Error: ${sourcePath} is not a directory`);
            process.exit(1);
        }

        // Handle watch mode
        if (options.watch) {
            console.log(`Watching ${sourcePath}...`);
            try {
                const watcher = watch(sourcePath, { recursive: true });
                for await (const event of watcher) {
                    console.log(`Changes detected in: ${event.filename}`);
                    await processDirectory(sourcePath, options);
                }
            } catch (error) {
                console.error('Watch error:', error);
                process.exit(1);
            }
        } else {
            // Single compilation
            await processDirectory(sourcePath, options);
        }
    });

async function processDirectory(sourcePath: string, options: { output?: string }) {
    console.log(`Processing directory: ${sourcePath}`);
    try {
        console.log("Building CodeTree...");
        const codeTree = new CodeTree(sourcePath);
        
        console.log("Compiling...");
        const compiler = new Compiler();
        await compiler.compile(codeTree);

        console.dir(codeTree, { depth: null });
        
        console.log("Generating output files...");
        // 如果指定了输出路径就使用指定路径，否则使用源目录下的 data 文件夹
        const outputPath = options.output 
            ? path.resolve(process.cwd(), options.output)
            : path.join(path.dirname(sourcePath), 'data');
            
        const fileMaker = new FileMaker(sourcePath, outputPath);
        await fileMaker.process(codeTree);
        
        console.log(`Compilation completed successfully. Output: ${outputPath}`);
    } catch (error) {
        console.error('Error processing directory:', error);
        process.exit(1);
    }
}

program.parse();