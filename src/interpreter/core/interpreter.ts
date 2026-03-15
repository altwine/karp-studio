import { processGenerator } from "../utils/runner.ts";
import { createLexer } from "../lexer/lexer.ts";
import {
	FunctionDeclaration,
	Program,
	EnumDeclaration,
	Statement,
	SwitchStatement,
	ReturnStatement,
	PrintStatement,
	BinaryExpression,
	CallExpression,
	Expression,
	AssignmentStatement,
	WhileStatement,
} from "../parser/ast.ts";
import { createParser } from "../parser/parser.ts";
import { Scope } from "./scope.ts";
import { OUTPUT_CONTAINER, RUN_CODE_BUTTON } from "../../ui/elements.ts";
import { setProgressCursor } from "../../ui/cursor.ts";

export type RuntimeValue = number | string;

export type OutputCommand = {
	type: "print";
	args: RuntimeValue[];
};

class ReturnValue extends Error {
	constructor(public value: RuntimeValue) {
		super("return");
	}
}

interface EnumInfo {
	name: string;
	members: string[];
}

export class Interpreter {
	private globalScope: Scope;
	private enums: Map<string, EnumInfo> = new Map();
	private functions: Map<string, FunctionDeclaration> = new Map();

	constructor(private program: Program) {
		this.globalScope = new Scope();
	}

	public *run(): Generator<OutputCommand, void, unknown> {
		for (const decl of this.program.declarations) {
			if (decl.type === "EnumDeclaration") {
				this.registerEnum(decl);
			} else if (decl.type === "FunctionDeclaration") {
				this.registerFunction(decl);
			}
		}

		try {
			yield* this.executeBlock(this.program.body, this.globalScope);
		} catch (e) {
			if (e instanceof ReturnValue) {
				throw new Error('Оператор "вернуть" не допустим на верхнем уровне');
			}
			throw e;
		}
	}

	private registerEnum(decl: EnumDeclaration): void {
		if (this.enums.has(decl.name)) {
			throw new Error(`Перечисление "${decl.name}" уже определено`);
		}
		this.enums.set(decl.name, { name: decl.name, members: decl.members });
	}

	private registerFunction(decl: FunctionDeclaration): void {
		if (this.functions.has(decl.name)) {
			throw new Error(`Функция "${decl.name}" уже определена`);
		}
		this.functions.set(decl.name, decl);
	}

	private *executeBlock(statements: Statement[], scope: Scope): Generator<OutputCommand, void, unknown> {
		for (const stmt of statements) {
			yield* this.executeStatement(stmt, scope);
		}
	}

	private *executeStatement(stmt: Statement, scope: Scope): Generator<OutputCommand, void, unknown> {
		switch (stmt.type) {
			case "AssignmentStatement":
				yield* this.executeAssignment(stmt, scope);
				break;
			case "WhileStatement":
				yield* this.executeWhile(stmt, scope);
				break;
			case "ReturnStatement":
				yield* this.executeReturn(stmt, scope);
				break;
			case "PrintStatement":
				yield* this.executePrint(stmt, scope);
				break;
			case "SwitchStatement":
				yield* this.executeSwitch(stmt, scope);
				break;
			case "ExpressionStatement":
				yield* this.evaluate(stmt.expression, scope);
				break;
			default:
				throw new Error(`Неизвестный тип оператора: ${(stmt as any).type}`);
		}
	}

	private *executeAssignment(stmt: AssignmentStatement, scope: Scope): Generator<OutputCommand, void, unknown> {
		const value = yield* this.evaluate(stmt.right, scope);
		const varName = stmt.left.name;

		switch (stmt.operator) {
			case ":=":
				scope.declare(varName, value);
				break;
			case "=":
				scope.assign(varName, value);
				break;
			case "+=":
				const current = scope.get(varName);
				if (typeof current !== "number" || typeof value !== "number") {
					throw new Error('Оператор "+=" применим только к числам');
				}
				scope.assign(varName, current + value);
				break;
			default:
				throw new Error(`Неизвестный оператор присваивания: ${stmt.operator}`);
		}
	}

	private *executeWhile(stmt: WhileStatement, scope: Scope): Generator<OutputCommand, void, unknown> {
		while (this.isTruthy(yield* this.evaluate(stmt.condition, scope))) {
			const iterationScope = scope.createChild();
			yield* this.executeBlock(stmt.body.statements, iterationScope);
		}
	}

	private *executeReturn(stmt: ReturnStatement, scope: Scope): Generator<OutputCommand, never, unknown> {
		const value = stmt.argument ? yield* this.evaluate(stmt.argument, scope) : 0;
		throw new ReturnValue(value);
	}

	private *executePrint(stmt: PrintStatement, scope: Scope): Generator<OutputCommand, void, unknown> {
		const parts: RuntimeValue[] = [];
		for (const arg of stmt.arguments) {
			parts.push(yield* this.evaluate(arg, scope));
		}
		yield { type: "print", args: parts };
	}

	private *executeSwitch(stmt: SwitchStatement, scope: Scope): Generator<OutputCommand, void, unknown> {
		const discriminant = yield* this.evaluate(stmt.discriminant, scope);
		let matched = false;

		for (const c of stmt.cases) {
			if (discriminant === c.value) {
				yield* this.executeBlock(c.body.statements, scope);
				matched = true;
				break;
			}
		}

		if (!matched && stmt.defaultCase) {
			yield* this.executeBlock(stmt.defaultCase.statements, scope);
		}
	}

	private *evaluate(expr: Expression, scope: Scope): Generator<OutputCommand, RuntimeValue, unknown> {
		switch (expr.type) {
			case "LiteralExpression":
				return expr.value;
			case "IdentifierExpression":
				return scope.get(expr.name);
			case "BinaryExpression":
				return yield* this.evaluateBinary(expr, scope);
			case "CallExpression":
				return yield* this.evaluateCall(expr, scope);
			default:
				throw new Error(`Неизвестное выражение: ${(expr as any).type}`);
		}
	}

	private *evaluateBinary(expr: BinaryExpression, scope: Scope): Generator<OutputCommand, RuntimeValue, unknown> {
		const left = yield* this.evaluate(expr.left, scope);
		const right = yield* this.evaluate(expr.right, scope);

		switch (expr.operator) {
			case "+":
				if (typeof left !== "number" || typeof right !== "number") {
					throw new Error('Оператор "+" применим только к числам');
				}
				return left + right;
			case "<":
				if (typeof left !== "number" || typeof right !== "number") {
					throw new Error('Оператор "<" применим только к числам');
				}
				return left < right ? 1 : 0;
			case "<=":
				if (typeof left !== "number" || typeof right !== "number") {
					throw new Error('Оператор "<=" применим только к числам');
				}
				return left <= right ? 1 : 0;
			case "==":
				return left === right ? 1 : 0;
			default:
				throw new Error(`Неизвестный бинарный оператор: ${expr.operator}`);
		}
	}

	private *evaluateCall(expr: CallExpression, scope: Scope): Generator<OutputCommand, RuntimeValue, unknown> {
		const funcName = expr.callee.name;

		if (funcName === "случайный_элемент") {
			if (expr.arguments.length !== 1) {
				throw new Error('Функция "случайный_элемент" ожидает 1 аргумент');
			}
			const arg = expr.arguments[0];
			let enumName: string;
			if (arg.type === "IdentifierExpression") {
				enumName = arg.name;
			} else if (arg.type === "LiteralExpression" && typeof arg.value === "string") {
				enumName = arg.value;
			} else {
				throw new Error('Аргумент "случайный_элемент" должен быть именем перечисления');
			}
			const enumInfo = this.enums.get(enumName);
			if (!enumInfo) {
				throw new Error(`Перечисление "${enumName}" не найдено`);
			}
			const randomIndex = Math.floor(Math.random() * enumInfo.members.length);
			return enumInfo.members[randomIndex];
		}

		const funcDecl = this.functions.get(funcName);
		if (!funcDecl) {
			throw new Error(`Функция "${funcName}" не определена`);
		}

		if (funcDecl.parameters.length !== expr.arguments.length) {
			throw new Error(
				`Функция "${funcName}" ожидает ${funcDecl.parameters.length} аргументов, получено ${expr.arguments.length}`,
			);
		}

		const localScope = scope.createChild();

		for (let i = 0; i < funcDecl.parameters.length; i++) {
			const param = funcDecl.parameters[i];
			const argValue = yield* this.evaluate(expr.arguments[i], scope);
			localScope.declare(param.name, argValue);
		}

		try {
			yield* this.executeBlock(funcDecl.body.statements, localScope);
		} catch (e) {
			if (e instanceof ReturnValue) {
				return e.value;
			}
			throw e;
		}

		return 0;
	}

	private isTruthy(val: RuntimeValue): boolean {
		if (typeof val === "number") return val !== 0;
		return false;
	}
}

export async function interpret(code: string) {
	if (RUN_CODE_BUTTON.disabled) return;
	RUN_CODE_BUTTON.disabled = true;

	setProgressCursor(true);

	try {
		const perfStart = performance.now();
		OUTPUT_CONTAINER.innerHTML = "";

		const tokens = createLexer(code);
		const ast = createParser(tokens);
		const interpreter = new Interpreter(ast);
		const generator = interpreter.run();

		await processGenerator(generator);

		const perfEnd = performance.now();
		const perfDelta = Math.ceil(perfEnd - perfStart);
		OUTPUT_CONTAINER.insertAdjacentText("beforeend", `Программа ${ast.name} исполнена (${perfDelta} мс.)`);
		OUTPUT_CONTAINER.scrollTop = OUTPUT_CONTAINER.scrollHeight;
	} catch (e: any) {
		OUTPUT_CONTAINER.innerHTML = `<span style="color:red;">${e.message}</span>`;
	}

	setProgressCursor(false);
	RUN_CODE_BUTTON.disabled = false;
}
