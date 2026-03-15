export type NodeType =
	| "Program"
	| "EnumDeclaration"
	| "FunctionDeclaration"
	| "Parameter"
	| "Block"
	| "AssignmentStatement"
	| "WhileStatement"
	| "ReturnStatement"
	| "PrintStatement"
	| "SwitchStatement"
	| "CaseClause"
	| "BinaryExpression"
	| "CallExpression"
	| "IdentifierExpression"
	| "LiteralExpression"
	| "TypeAnnotation"
	| "ExpressionStatement";

export interface Node {
	type: NodeType;
}

export interface Program extends Node {
	type: "Program";
	name: string;
	declarations: Declaration[];
	body: Statement[];
}

export type Declaration = EnumDeclaration | FunctionDeclaration;

export interface EnumDeclaration extends Node {
	type: "EnumDeclaration";
	name: string;
	members: string[];
}

export interface FunctionDeclaration extends Node {
	type: "FunctionDeclaration";
	name: string;
	parameters: Parameter[];
	returnType?: TypeAnnotation;
	body: Block;
}

export interface Parameter extends Node {
	type: "Parameter";
	name: string;
	typeAnnotation: TypeAnnotation;
}

export interface TypeAnnotation extends Node {
	type: "TypeAnnotation";
	name: string;
}

export interface Block extends Node {
	type: "Block";
	statements: Statement[];
}

export type Statement =
	| AssignmentStatement
	| WhileStatement
	| ReturnStatement
	| PrintStatement
	| SwitchStatement
	| ExpressionStatement;

export interface AssignmentStatement extends Node {
	type: "AssignmentStatement";
	left: IdentifierExpression;
	operator: ":=" | "=" | "+=";
	right: Expression;
}

export interface WhileStatement extends Node {
	type: "WhileStatement";
	condition: Expression;
	body: Block;
}

export interface ReturnStatement extends Node {
	type: "ReturnStatement";
	argument?: Expression;
}

export interface PrintStatement extends Node {
	type: "PrintStatement";
	arguments: Expression[];
}

export interface SwitchStatement extends Node {
	type: "SwitchStatement";
	discriminant: Expression;
	cases: CaseClause[];
	defaultCase?: Block;
}

export interface CaseClause extends Node {
	type: "CaseClause";
	value: string;
	body: Block;
}

export interface ExpressionStatement extends Node {
	type: "ExpressionStatement";
	expression: Expression;
}

export type Expression = LiteralExpression | IdentifierExpression | CallExpression | BinaryExpression;

export interface LiteralExpression extends Node {
	type: "LiteralExpression";
	value: string | number;
}

export interface IdentifierExpression extends Node {
	type: "IdentifierExpression";
	name: string;
}

export interface CallExpression extends Node {
	type: "CallExpression";
	callee: IdentifierExpression;
	arguments: Expression[];
}

export interface BinaryExpression extends Node {
	type: "BinaryExpression";
	left: Expression;
	operator: "+" | "<" | "<=" | "==";
	right: Expression;
}
