import fs from 'fs';
import path from 'path';
import CodeTree, { Snippet, Tags } from './CodeTree.js';

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
    public async process(codeTree: CodeTree) {
        this.initializeOutputDirectory();

        // Process each namespace in the CodeTree
        for (const [namespace, data] of Object.entries(codeTree.root)) {
            await this.processNamespace(namespace, data);
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
    private async processNamespace(namespace: string, data: { snippets: Snippet[], tags: Tags }) {
        // Create namespace directory, functions directory, and tags directory
        const namespacePath = path.join(this.outputPath, namespace);
        const functionsPath = path.join(namespacePath, 'functions');
        const tagsPath = path.join(namespacePath, 'tags', 'functions');
        
        fs.mkdirSync(functionsPath, { recursive: true });
        fs.mkdirSync(tagsPath, { recursive: true });

        // Process each code snippet
        for (const snippet of data.snippets) {
            await this.writeFunction(functionsPath, snippet);
        }

        // Process function tags
        await this.writeTags(tagsPath, data.tags);
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
     * Write function tags to files
     */
    private async writeTags(basePath: string, tags: Tags) {
        for (const [location, tag] of Object.entries(tags.functions)) {
            // Handle nested directories in tag location
            const parts = location.split('/');
            const filename = `${parts.pop()}.json`;
            const dirPath = path.join(basePath, ...parts);

            // Create nested directories if needed
            fs.mkdirSync(dirPath, { recursive: true });

            // Write the tag file
            const filePath = path.join(dirPath, filename);
            fs.writeFileSync(filePath, JSON.stringify({
                values: tag.values
            }, null, 2));
        }
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