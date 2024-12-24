import fs from "fs";
import path from "path";

export interface ImportConstraint {
    target: string;// The filename of the module or file you want to import
    name: string;// The name of the variable you can use in the INJ code
}

export interface ExportConstraint {
    target: string;// The filename of the module or file you want to export
    name: string;// The name of the variable you can use in the INJ code
}

/**
 * Interface representing a code snippet in the tree
 */
export interface Snippet {
    namespace: string;
    filename: string;
    code: string;
    imports: ImportConstraint[];
    exports: ExportConstraint[];
}

/**
 * Interface representing the root structure of the code tree
 * Maps namespace strings to arrays of snippets
 */
interface CodeTreeRoot {
    [namespace: string]: Snippet[];
}

/**
 * Class representing a tree structure for Minecraft function files
 * Scans and organizes mcfunction files from a datapack directory
 */
export default class CodeTree {
    public root: CodeTreeRoot;

    constructor(filename: string) {
        this.root = {
            inj: []
        };
        // Only scan direct subdirectories in root
        const items = fs.readdirSync(filename);
        for (const item of items) {
            const fullPath = path.join(filename, item);
            if (fs.statSync(fullPath).isDirectory()) {
                this.scanNamespace(fullPath);
            }
        }
    }

    /**
     * Scans a namespace directory and processes its 'functions' subdirectory
     * @param namespacePath - Path to the namespace directory
     */
    private scanNamespace(namespacePath: string) {
        const namespace = path.basename(namespacePath);
        const functionsPath = path.join(namespacePath, 'functions');
        
        // If 'functions' directory exists, scan it
        if (fs.existsSync(functionsPath)) {
            this.root[namespace] = [];
            this.scanFunctionsDirectory(functionsPath, namespace, functionsPath);
        }
    }

    /**
     * Recursively scans the functions directory and processes all .mcfunction files
     * @param directory - Current directory being scanned
     * @param namespace - Namespace of the datapack
     * @param functionsRoot - Root directory of functions for relative path calculation
     */
    private scanFunctionsDirectory(directory: string, namespace: string, functionsRoot: string) {
        const items = fs.readdirSync(directory);
        
        for (const item of items) {
            const fullPath = path.join(directory, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // Recursively scan subdirectories
                this.scanFunctionsDirectory(fullPath, namespace, functionsRoot);
            } else if (item.endsWith('.mcfunction')) {
                // Read and process .mcfunction file
                const code = fs.readFileSync(fullPath, 'utf-8');
                
                // Calculate path relative to functions directory and remove extension
                const relativePath = path.relative(functionsRoot, fullPath);
                const filenameWithoutExt = relativePath.slice(0, -11); // Remove '.mcfunction' extension
                
                this.root[namespace].push({
                    namespace: namespace,
                    filename: filenameWithoutExt.replace(/\\/g, '/'), // Ensure forward slashes
                    code: code,
                    imports: [],
                    exports: []
                });
            }
        }
    }
}