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
}

/**
 * Represents a list of tags
 * @param functions - The list of function tags
*/
export interface Tags {
    functions: {
        [location: string]: {
            values: string[];
        };
    };
}

/**
 * Interface representing the root structure of the code tree
 * Maps namespace strings to arrays of snippets
 */
interface CodeTreeRoot {
    [namespace: string]: {
        snippets: Snippet[];
        tags: Tags;
    };
}

/**
 * Class representing a tree structure for Minecraft function files
 * Scans and organizes inj files from a datapack directory
 */
export default class CodeTree {
    public root: CodeTreeRoot;

    constructor(filename: string) {
        this.root = {
            inj: {
                snippets: [],
                tags: {
                    functions: {
                        
                    }
                }
            }
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
        
        // Initialize namespace in root if not exists
        if (!this.root[namespace]) {
            this.root[namespace] = {
                snippets: [],
                tags: {
                    functions: {}
                }
            };
        }

        const functionsPath = path.join(namespacePath, 'functions');
        const tagsPath = path.join(namespacePath, 'tags', 'functions');
        
        // Scan functions directory if it exists
        if (fs.existsSync(functionsPath)) {
            this.scanFunctionsDirectory(functionsPath, namespace, functionsPath);
        }

        // Scan tags directory if it exists
        if (fs.existsSync(tagsPath)) {
            this.scanFunctionsTagsDirectory(tagsPath, namespace);
        }
    }

    /**
     * Recursively scans the functions directory and processes all .inj files
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
            } else if (item.endsWith('.inj')) {
                // Read and process .inj file
                const code = fs.readFileSync(fullPath, 'utf-8');
                
                // Calculate path relative to functions directory and remove extension
                const relativePath = path.relative(functionsRoot, fullPath);
                const filenameWithoutExt = relativePath.slice(0, -4); // Remove '.inj' extension
                
                this.root[namespace].snippets.push({
                    namespace: namespace,
                    filename: filenameWithoutExt.replace(/\\/g, '/'), // Ensure forward slashes
                    code: code
                });
            }
        }
    }

    /**
     * Recursively scans the tags directory and processes all .json files
     * @param directory - Current directory being scanned
     * @param namespace - Namespace of the datapack
     */
    private scanFunctionsTagsDirectory(directory: string, namespace: string) {
        const items = fs.readdirSync(directory);
        
        for (const item of items) {
            const fullPath = path.join(directory, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // Recursively scan subdirectories
                this.scanFunctionsTagsDirectory(fullPath, namespace);
            } else if (item.endsWith('.json')) {
                // Read and process .json file
                const content = fs.readFileSync(fullPath, 'utf-8');
                try {
                    const tagData = JSON.parse(content);
                    
                    // Calculate path relative to the functions tags directory and remove extension
                    const relativePath = path.relative(directory, fullPath);
                    const tagPath = relativePath.slice(0, -5); // Remove '.json' extension
                    
                    // Store tag values in the tree
                    if (tagData.values && Array.isArray(tagData.values)) {
                        this.root[namespace].tags.functions[tagPath.replace(/\\/g, '/')] = {
                            values: tagData.values
                        };
                    }
                } catch (error) {
                    console.warn(`Failed to parse tag file ${fullPath}: ${error}`);
                }
            }
        }
    }
}