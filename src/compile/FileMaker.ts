import fs from 'fs';
import path from 'path';
import { Snippet } from './CodeTree.js';

export class FileMaker {
    private sourcePath: string;
    private outputPath: string;

    constructor(sourcePath: string, outputPath: string) {
        this.sourcePath = sourcePath;
        this.outputPath = outputPath;
    }

    /**
     * Process the CodeTree and generate output files
     */
    public async process(codeTree: { root: Record<string, Snippet[]> }) {
        this.initializeOutputDirectory();

        // Process each namespace in the CodeTree
        for (const [namespace, nodes] of Object.entries(codeTree.root)) {
            await this.processNamespace(namespace, nodes);
        }

        // Copy other directories from source (except functions)
        await this.copyNonFunctionDirs();
    }

    private initializeOutputDirectory() {
        if (fs.existsSync(this.outputPath)) {
            const entries = fs.readdirSync(this.outputPath, { withFileTypes: true });
            for (const entry of entries) {
                const entryPath = path.join(this.outputPath, entry.name);
                if (entry.isDirectory()) {
                    fs.rmSync(entryPath, { recursive: true, force: true }); // Recursively delete subdirectories
                }
            }
        } else {
            fs.mkdirSync(this.outputPath, { recursive: true });
        }
    }

    /**
     * Process a single namespace and its code nodes
     */
    private async processNamespace(namespace: string, nodes: Snippet[]) {
        // Create namespace directory and functions directory
        const namespacePath = path.join(this.outputPath, namespace);
        const functionsPath = path.join(namespacePath, 'functions');
        fs.mkdirSync(functionsPath, { recursive: true });

        // Process each code node
        for (const node of nodes) {
            await this.writeFunction(functionsPath, node);
        }
    }

    /**
     * Write a single function file
     */
    private async writeFunction(basePath: string, node: Snippet) {
        // Handle nested directories in filename
        const parts = node.filename.split('/');
        const filename = parts.pop()!;
        const dirPath = path.join(basePath, ...parts);

        // Create nested directories if needed
        fs.mkdirSync(dirPath, { recursive: true });

        // Write the function file
        const filePath = path.join(dirPath, `${filename}.mcfunction`);
        fs.writeFileSync(filePath, node.code);
    }

    /**
     * Copy non-function directories from source to output
     */
    private async copyNonFunctionDirs() {
        try {
            const entries = fs.readdirSync(this.sourcePath, { withFileTypes: true });

            for (const entry of entries) {
                const innerEntries = fs.readdirSync(path.join(entry.parentPath, entry.name), { withFileTypes: true });
                for (const innerEntry of innerEntries) {
                    if (innerEntry.isDirectory() && innerEntry.name !== 'functions') {
                        const relativePath = path.relative(this.sourcePath, path.join(innerEntry.parentPath, innerEntry.name));
                        const sourceDirPath = path.join(this.sourcePath, relativePath);
                        const targetDirPath = path.join(this.outputPath, relativePath);

                        this.copyDirectory(sourceDirPath, targetDirPath);
                    }
                }
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * Recursively copy a directory
     */
    private copyDirectory(source: string, target: string) {
        fs.mkdirSync(target, { recursive: true });
        const entries = fs.readdirSync(source, { withFileTypes: true });

        for (const entry of entries) {
            const sourcePath = path.join(source, entry.name);
            const targetPath = path.join(target, entry.name);

            if (entry.isDirectory()) {
                this.copyDirectory(sourcePath, targetPath);
            } else {
                fs.copyFileSync(sourcePath, targetPath);
            }
        }
    }
} 