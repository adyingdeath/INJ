import fs from 'fs';
import path from 'path';

interface CodeNode {
    namespace: string;
    filename: string;
    code: string;
}

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
    public async process(codeTree: { root: Record<string, CodeNode[]> }) {
        // Create output directory if it doesn't exist
        fs.mkdirSync(this.outputPath, { recursive: true });

        // Process each namespace in the CodeTree
        for (const [namespace, nodes] of Object.entries(codeTree.root)) {
            await this.processNamespace(namespace, nodes);
        }

        // Copy other directories from source (except functions)
        await this.copyNonFunctionDirs();
    }

    /**
     * Process a single namespace and its code nodes
     */
    private async processNamespace(namespace: string, nodes: CodeNode[]) {
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
    private async writeFunction(basePath: string, node: CodeNode) {
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
                if (entry.isDirectory() && entry.name !== 'functions') {
                    const sourceDirPath = path.join(this.sourcePath, entry.name);
                    const targetDirPath = path.join(this.outputPath, entry.name);
                    
                    this.copyDirectory(sourceDirPath, targetDirPath);
                }
            }
        } catch (error) {
            console.error('Error copying non-function directories:', error);
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