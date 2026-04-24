import { processGenerator } from "../utils/runner.ts";
import { createLexer } from "../lexer/lexer.ts";
import {
	FunctionDeclaration,
	Program,
	EnumDeclaration,
	Statement,
	SwitchStatement,
	ReturnStatement,
	BinaryExpression,
	CallExpression,
	Expression,
	AssignmentStatement,
	WhileStatement,
	IfStatement,
} from "../parser/ast.ts";
import { createParser } from "../parser/parser.ts";
import { Scope } from "./scope.ts";
import { TEXT_OUTPUT_CONTAINER } from "../../ui/elements.ts";

export type RuntimeValue = number | string;

export type OutputCommand = {
	type: "print" | "turtle";
	command?:
		| "showTurtle"
		| "hideTurtle"
		| "home"
		| "clear"
		| "enableGrid"
		| "disableGrid"
		| "bgColor"
		| "penColor"
		| "penWidth"
		| "penDown"
		| "penUp"
		| "left"
		| "right"
		| "backward"
		| "forward";
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

		this.globalScope.declare("ПИ", Math.PI);
		this.globalScope.declare("ФИ", 1.6180339887);
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
			case "IfStatement":
				yield* this.executeIf(stmt, scope);
				break;
			case "ReturnStatement":
				yield* this.executeReturn(stmt, scope);
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

	private *executeIf(stmt: IfStatement, scope: Scope): Generator<OutputCommand, void, unknown> {
		const conditionValue = yield* this.evaluate(stmt.condition, scope);

		if (this.isTruthy(conditionValue)) {
			yield* this.executeBlock(stmt.thenBranch.statements, scope);
		} else if (stmt.elseBranch) {
			yield* this.executeBlock(stmt.elseBranch.statements, scope);
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
			case "-=":
			case "*=":
			case "/=":
				const current = scope.get(varName);
				if (typeof current !== "number" || typeof value !== "number") {
					throw new Error(`Оператор "${stmt.operator}" применим только к числам`);
				}
				let result: number;
				switch (stmt.operator) {
					case "+=":
						result = current + value;
						break;
					case "-=":
						result = current - value;
						break;
					case "*=":
						result = current * value;
						break;
					case "/=":
						if (value === 0) throw new Error("Деление на ноль");
						result = current / value;
						break;
					default:
						throw new Error(`Неизвестный оператор присваивания: ${stmt.operator}`);
				}
				scope.assign(varName, result);
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
			case "-":
			case "*":
			case "/":
				if (typeof left !== "number" || typeof right !== "number") {
					throw new Error(`Оператор "${expr.operator}" применим только к числам`);
				}
				switch (expr.operator) {
					case "+":
						return left + right;
					case "-":
						return left - right;
					case "*":
						return left * right;
					case "/":
						if (right === 0) throw new Error("Деление на ноль");
						return left / right;
				}
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
			case ">":
				if (typeof left !== "number" || typeof right !== "number") {
					throw new Error('Оператор ">" применим только к числам');
				}
				return left > right ? 1 : 0;
			case ">=":
				if (typeof left !== "number" || typeof right !== "number") {
					throw new Error('Оператор ">=" применим только к числам');
				}
				return left >= right ? 1 : 0;
			case "==":
				return left === right ? 1 : 0;
			default:
				throw new Error(`Неизвестный бинарный оператор: ${expr.operator}`);
		}
	}

	private *evaluateCall(expr: CallExpression, scope: Scope): Generator<OutputCommand, RuntimeValue, unknown> {
		const funcName = expr.callee.name;

		if (funcName === "печать") {
			const args: RuntimeValue[] = [];
			for (const arg of expr.arguments) {
				args.push(yield* this.evaluate(arg, scope));
			}
			yield { type: "print", args };
			return 0;
		}

		if (funcName === "случайное_число") {
			if (expr.arguments.length !== 2) {
				throw new Error('Функция "случайное_число" ожидает 2 аргумента');
			}
			const arg1 = yield* this.evaluate(expr.arguments[0], scope);
			if (typeof arg1 !== "number") {
				throw new Error('Функция "случайное_число" ожидает число 1 аргументом');
			}
			const arg2 = yield* this.evaluate(expr.arguments[1], scope);
			if (typeof arg2 !== "number") {
				throw new Error('Функция "случайное_число" ожидает число 2 аргументом');
			}
			const min = Math.ceil(arg1);
			return Math.floor(Math.random() * (Math.floor(arg2) - min + 1)) + min;
		}

		if (funcName === "синус") {
			if (expr.arguments.length !== 1) {
				throw new Error('Функция "синус" ожидает 1 аргумент (угол в градусах)');
			}
			const angleDeg = yield* this.evaluate(expr.arguments[0], scope);
			if (typeof angleDeg !== "number") {
				throw new Error("Угол должен быть числом");
			}
			const angleRad = (angleDeg * Math.PI) / 180;
			return Math.sin(angleRad);
		}

		if (funcName === "косинус") {
			if (expr.arguments.length !== 1) {
				throw new Error('Функция "косинус" ожидает 1 аргумент (угол в градусах)');
			}
			const angleDeg = yield* this.evaluate(expr.arguments[0], scope);
			if (typeof angleDeg !== "number") {
				throw new Error("Угол должен быть числом");
			}
			const angleRad = (angleDeg * Math.PI) / 180;
			return Math.cos(angleRad);
		}

		if (funcName === "тангенс") {
			if (expr.arguments.length !== 1) {
				throw new Error('Функция "тангенс" ожидает 1 аргумент (угол в градусах)');
			}
			const angleDeg = yield* this.evaluate(expr.arguments[0], scope);
			if (typeof angleDeg !== "number") {
				throw new Error("Угол должен быть числом");
			}
			const angleRad = (angleDeg * Math.PI) / 180;
			return Math.tan(angleRad);
		}

		if (funcName === "арксинус") {
			if (expr.arguments.length !== 1) {
				throw new Error('Функция "арксинус" ожидает 1 аргумент (число от -1 до 1)');
			}
			const x = yield* this.evaluate(expr.arguments[0], scope);
			if (typeof x !== "number") {
				throw new Error("Аргумент должен быть числом");
			}
			if (x < -1 || x > 1) {
				throw new Error("Аргумент арксинуса должен быть в диапазоне [-1, 1]");
			}
			const angleRad = Math.asin(x);
			return (angleRad * 180) / Math.PI;
		}

		if (funcName === "арккосинус") {
			if (expr.arguments.length !== 1) {
				throw new Error('Функция "арккосинус" ожидает 1 аргумент (число от -1 до 1)');
			}
			const x = yield* this.evaluate(expr.arguments[0], scope);
			if (typeof x !== "number") {
				throw new Error("Аргумент должен быть числом");
			}
			if (x < -1 || x > 1) {
				throw new Error("Аргумент арккосинуса должен быть в диапазоне [-1, 1]");
			}
			const angleRad = Math.acos(x);
			return (angleRad * 180) / Math.PI;
		}

		if (funcName === "арктангенс") {
			if (expr.arguments.length !== 1) {
				throw new Error('Функция "арктангенс" ожидает 1 аргумент (число)');
			}
			const x = yield* this.evaluate(expr.arguments[0], scope);
			if (typeof x !== "number") {
				throw new Error("Аргумент должен быть числом");
			}
			const angleRad = Math.atan(x);
			return (angleRad * 180) / Math.PI;
		}

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

		if (funcName === "вперед" || funcName === "вперёд") {
			if (expr.arguments.length !== 1) {
				throw new Error(`Функция "${funcName}" ожидает 1 аргумент (расстояние)`);
			}
			const distance = yield* this.evaluate(expr.arguments[0], scope);
			if (typeof distance !== "number") {
				throw new Error(`Расстояние должно быть числом`);
			}
			yield { type: "turtle", command: "forward", args: [distance] };
			return 0;
		}

		if (funcName === "назад") {
			if (expr.arguments.length !== 1) {
				throw new Error(`Функция "назад" ожидает 1 аргумент (расстояние)`);
			}
			const distance = yield* this.evaluate(expr.arguments[0], scope);
			if (typeof distance !== "number") {
				throw new Error(`Расстояние должно быть числом`);
			}
			yield { type: "turtle", command: "backward", args: [distance] };
			return 0;
		}

		if (funcName === "направо") {
			if (expr.arguments.length !== 1) {
				throw new Error(`Функция "направо" ожидает 1 аргумент (угол)`);
			}
			const angle = yield* this.evaluate(expr.arguments[0], scope);
			if (typeof angle !== "number") {
				throw new Error(`Угол должен быть числом`);
			}
			yield { type: "turtle", command: "right", args: [angle] };
			return 0;
		}

		if (funcName === "налево") {
			if (expr.arguments.length !== 1) {
				throw new Error(`Функция "налево" ожидает 1 аргумент (угол)`);
			}
			const angle = yield* this.evaluate(expr.arguments[0], scope);
			if (typeof angle !== "number") {
				throw new Error(`Угол должен быть числом`);
			}
			yield { type: "turtle", command: "left", args: [angle] };
			return 0;
		}

		if (funcName === "поднять_перо") {
			yield { type: "turtle", command: "penUp", args: [] };
			return 0;
		}

		if (funcName === "опустить_перо") {
			yield { type: "turtle", command: "penDown", args: [] };
			return 0;
		}

		if (funcName === "толщина_пера") {
			if (expr.arguments.length !== 1) {
				throw new Error(`Функция "толщина_пера" ожидает 1 аргумент (толщина)`);
			}
			const width = yield* this.evaluate(expr.arguments[0], scope);
			if (typeof width !== "number") {
				throw new Error(`Толщина должна быть числом`);
			}
			yield { type: "turtle", command: "penWidth", args: [width] };
			return 0;
		}

		if (funcName === "включить_сетку") {
			yield { type: "turtle", command: "enableGrid", args: [] };
			return 0;
		}

		if (funcName === "выключить_сетку") {
			yield { type: "turtle", command: "disableGrid", args: [] };
			return 0;
		}

		if (funcName === "цвет_фона") {
			if (expr.arguments.length !== 3 && expr.arguments.length !== 1) {
				throw new Error(`Функция "цвет_фона" ожидает 1 (hex) или 3 (r,g,b) аргумента`);
			}

			if (expr.arguments.length === 3) {
				const r = yield* this.evaluate(expr.arguments[0], scope);
				const g = yield* this.evaluate(expr.arguments[1], scope);
				const b = yield* this.evaluate(expr.arguments[2], scope);
				if (typeof r !== "number" || typeof g !== "number" || typeof b !== "number") {
					throw new Error(`Цвета должны быть числами`);
				}
				yield { type: "turtle", command: "bgColor", args: [r, g, b] };
			} else {
				const color = yield* this.evaluate(expr.arguments[0], scope);
				if (typeof color !== "string") {
					throw new Error(`Цвет должен быть строкой`);
				}
				yield { type: "turtle", command: "bgColor", args: [color] };
			}
			return 0;
		}

		if (funcName === "цвет_пера") {
			if (expr.arguments.length !== 3 && expr.arguments.length !== 1) {
				throw new Error(`Функция "цвет_пера" ожидает 1 (hex) или 3 (r,g,b) аргумента`);
			}

			if (expr.arguments.length === 3) {
				const r = yield* this.evaluate(expr.arguments[0], scope);
				const g = yield* this.evaluate(expr.arguments[1], scope);
				const b = yield* this.evaluate(expr.arguments[2], scope);
				if (typeof r !== "number" || typeof g !== "number" || typeof b !== "number") {
					throw new Error(`Цвета должны быть числами`);
				}
				yield { type: "turtle", command: "penColor", args: [r, g, b] };
			} else {
				const color = yield* this.evaluate(expr.arguments[0], scope);
				if (typeof color !== "string") {
					throw new Error(`Цвет должен быть строкой`);
				}
				yield { type: "turtle", command: "penColor", args: [color] };
			}
			return 0;
		}

		if (funcName === "очистить") {
			yield { type: "turtle", command: "clear", args: [] };
			return 0;
		}

		if (funcName === "домой") {
			yield { type: "turtle", command: "home", args: [] };
			return 0;
		}

		if (funcName === "спрятать_черепаху") {
			yield { type: "turtle", command: "hideTurtle", args: [] };
			return 0;
		}

		if (funcName === "показать_черепаху") {
			yield { type: "turtle", command: "showTurtle", args: [] };
			return 0;
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

export let interpreterState = { active: false };
export async function interpret(code: string) {
	try {
		const perfStart = performance.now();
		TEXT_OUTPUT_CONTAINER.innerHTML = "";

		const tokens = createLexer(code);
		const ast = createParser(tokens);
		const interpreter = new Interpreter(ast);
		const generator = interpreter.run();

		await processGenerator(generator);

		const perfEnd = performance.now();
		const perfDelta = Math.ceil(perfEnd - perfStart);
		TEXT_OUTPUT_CONTAINER.insertAdjacentText("beforeend", `Программа ${ast.name} исполнена (${perfDelta} мс.)`);
		TEXT_OUTPUT_CONTAINER.scrollTop = TEXT_OUTPUT_CONTAINER.scrollHeight;
	} catch (e: any) {
		TEXT_OUTPUT_CONTAINER.innerHTML = `<span style="color:red;">${e.message}</span>`;
	}
}
