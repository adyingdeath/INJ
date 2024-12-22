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
                    await processDirectory(sourcePath);
                }
            } catch (error) {
                console.error('Watch error:', error);
                process.exit(1);
            }
        } else {
            // Single compilation
            await processDirectory(sourcePath);
        }
    });

async function processDirectory(sourcePath: string) {
    console.log(`Processing directory: ${sourcePath}`);
    try {
        console.log("Building CodeTree...");
        const codeTree = new CodeTree(sourcePath);
        
        console.log("Compiling...");
        const compiler = new Compiler();
        await compiler.compile(codeTree);
        
        console.log("Generating output files...");
        const outputPath = path.join(process.cwd(), 'dist'); // 你可以根据需要修改输出路径
        const fileMaker = new FileMaker(sourcePath, outputPath);
        await fileMaker.process(codeTree);
        
        console.log("Compilation completed successfully");
    } catch (error) {
        console.error('Error processing directory:', error);
        process.exit(1);
    }
}

program.parse();