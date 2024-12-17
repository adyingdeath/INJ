// Base node type that all AST nodes will inherit from
export type NodeType = 
  | 'Program'
  | 'MinecraftCommand'
  | 'JSCode'
  | 'IfStatement'
  | 'WhileStatement'
  | 'ForStatement'
  | 'Expression';  // 保留Expression用于条件判断

export interface ASTNode {
  type: NodeType;
  start: number;
  end: number;
}

// Root node of the program
export interface Program extends ASTNode {
  type: 'Program';
  body: Statement[];
}

// Represents statements that form the program structure
export type Statement = 
  | MinecraftCommand
  | JSCode
  | IfStatement
  | WhileStatement
  | ForStatement;

// Minecraft command statement
export interface MinecraftCommand extends ASTNode {
  type: 'MinecraftCommand';
  command: string;
}

// JavaScript code block
export interface JSCode extends ASTNode {
  type: 'JSCode';
  code: string;
}

// If statement
export interface IfStatement extends ASTNode {
  type: 'IfStatement';
  condition: Expression;
  consequent: Statement[];
  alternate?: Statement[];
}

// While loop statement
export interface WhileStatement extends ASTNode {
  type: 'WhileStatement';
  condition: Expression;
  body: Statement[];
}

// For loop statement
export interface ForStatement extends ASTNode {
  type: 'ForStatement';
  params: string;
  body: Statement[];
}

// Expression type (用于条件判断)
export type Expression = {
  type: 'Expression';
  minecraft: string;
  js: string;
  logic: "AND" | "OR" | null;
}
