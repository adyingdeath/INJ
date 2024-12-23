#!/usr/bin/env node

import { Command } from "commander";
import path from "path";
import fs from "fs";
import chokidar from "chokidar";
import CodeTree from "./compile/CodeTree.js";
import { Compiler } from "./compile/Compiler.js";
import { FileMaker } from "./compile/FileMaker.js";

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

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
            console.error(`${RED}Error: ${RESET}Path ${sourcePath} does not exist`);
            process.exit(1);
        }

        if (!fs.statSync(sourcePath).isDirectory()) {
            console.error(`${RED}Error: ${RESET}${sourcePath} is not a directory`);
            process.exit(1);
        }

        // First do an initial build
        try {
            await processDirectory(sourcePath, options);
        } catch (error) {
            console.error(`${RED}Build failed${RESET}`);
            if (options.watch != true) {
                process.exit(1);
            }
        }

        // Handle watch mode
        if (options.watch) {
            const watcher = chokidar.watch(sourcePath, {
                persistent: true,
                ignoreInitial: true,
                awaitWriteFinish: {
                    stabilityThreshold: 100,
                    pollInterval: 50
                },
                usePolling: true,
                interval: 100
            });

            async function handleChange(changedPath: string) {
                console.clear();
                console.log(`> ${GREEN}changes detected${RESET}`);
                try {
                    console.log(`> ${GREEN}compiling...${RESET}`);
                    await processDirectory(sourcePath, { ...options, log: false });
                    console.log(`> ${GREEN}watching...${RESET}`);
                } catch (error) {
                    console.error(`${RED}Compilation failed${RESET}`);
                    // Don't exit process on watch error, just continue watching
                }
            }

            // Handle watch errors
            watcher.on('error', (error) => {
                console.error(`${RED}Watch Error: Unable to monitor directory${RESET}`);
                console.error(`${RED}${error instanceof Error ? error.message : String(error)}${RESET}`);
                // Don't exit process on watch error, just continue watching
            });

            // Handle watch events
            watcher
                .on('ready', () => {
                    console.log(`> ${GREEN}watching...${RESET}`);
                })
                .on('all', handleChange)

            // Keep the process running
            const interval = setInterval(() => {}, 1000);
            process.on('SIGINT', () => {
                console.log("> exiting...");
                watcher.close().then(() => process.exit(0));
                clearInterval(interval);
            });
        }
    });

async function processDirectory(sourcePath: string, options: { output?: string, log?: boolean }) {
    if (options.log) {
        console.log(`Processing directory: ${sourcePath}`);
    }
    try {
        if (options.log) {
            console.log("Building CodeTree...");
        }
        const codeTree = new CodeTree(sourcePath);
        
        if (options.log) {
            console.log("Compiling...");
        }
        const compiler = new Compiler();
        await compiler.compile(codeTree);
        
        if (options.log) {
            console.log("Generating output files...");
        }
        // Use the specified output path if provided; otherwise, use the 'data' folder under the source directory.
        const outputPath = options.output 
            ? path.resolve(process.cwd(), options.output)
            : path.join(path.dirname(sourcePath), 'data');
            
        const fileMaker = new FileMaker(sourcePath, outputPath);
        await fileMaker.process(codeTree);
        
        if (options.log) {
            console.log(`Compilation completed successfully. Output: ${outputPath}`);
        }
    } catch (error: any) {
        if (error.code && error.code == 'BABEL_PARSE_ERROR') {
            if (error.name === 'SyntaxError') {
                console.error(error.message)
            } else {
                console.error(error);
            }
        } else {
            console.error(error);
        }
        throw error;
    }
}

program.parse();