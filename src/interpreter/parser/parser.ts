import { Token, TokenType } from "../lexer/tokens";
import {
	FunctionDeclaration,
	Program,
	EnumDeclaration,
	Statement,
	SwitchStatement,
	ReturnStatement,
	Expression,
	WhileStatement,
	IfStatement,
	TypeAnnotation,
	IdentifierExpression,
	Declaration,
	Parameter,
	Block,
	CaseClause,
} from "./ast";

export function createParser(tokens: Token[]): Program {
	const parser = new Parser(tokens);
	const program = parser.parseProgram();
	console.log(program);
	return program;
}

class Parser {
	private pos = 0;

	constructor(private tokens: Token[]) {}

	private peek(offset = 0): Token | null {
		const idx = this.pos + offset;
		return idx < this.tokens.length ? this.tokens[idx] : null;
	}

	private current(): Token {
		if (this.pos >= this.tokens.length) {
			throw new Error("Неожиданный конец файла");
		}
		return this.tokens[this.pos];
	}

	private next(): Token {
		if (this.pos >= this.tokens.length) {
			throw new Error("Неожиданный конец файла");
		}
		return this.tokens[this.pos++];
	}

	private match(...types: TokenType[]): boolean {
		const tok = this.peek();
		return tok !== null && types.includes(tok.type);
	}

	private consume(type: TokenType, message: string): Token {
		const tok = this.peek();
		if (!tok || tok.type !== type) {
			const found = tok ? `${TokenType[tok.type]} (${tok.value})` : "конец файла";
			throw new Error(`${message} — ожидалось ${TokenType[type]}, найдено ${found}`);
		}
		return this.next();
	}

	private isAtEnd(): boolean {
		return this.pos >= this.tokens.length;
	}

	parseProgram(): Program {
		this.consume(TokenType.KEYWORD, 'Ожидается "алг" в начале программы');
		const nameTok = this.consume(TokenType.IDENTIFIER, "Ожидается имя программы");
		const name = nameTok.value as string;

		const declarations: Declaration[] = [];
		const body: Statement[] = [];

		while (!this.isAtEnd()) {
			if (this.match(TokenType.KEYWORD)) {
				const kw = this.peek()!.value;
				if (kw === "перечисление") {
					declarations.push(this.parseEnumDeclaration());
				} else if (kw === "функция") {
					declarations.push(this.parseFunctionDeclaration());
				} else {
					body.push(this.parseStatement());
				}
			} else {
				body.push(this.parseStatement());
			}
		}

		return {
			type: "Program",
			name,
			declarations,
			body,
		};
	}

	parseEnumDeclaration(): EnumDeclaration {
		this.consume(TokenType.KEYWORD, 'Ожидается "перечисление"');
		const nameTok = this.consume(TokenType.IDENTIFIER, "Ожидается имя перечисления");
		const name = nameTok.value as string;
		this.consume(TokenType.COLON, 'Ожидается ":" после имени перечисления');
		this.consume(TokenType.INDENT, "Ожидается начало блока перечисления (отступ)");

		const members: string[] = [];
		while (!this.match(TokenType.DEDENT) && !this.isAtEnd()) {
			const memberTok = this.consume(TokenType.IDENTIFIER, "Ожидается имя варианта перечисления");
			members.push(memberTok.value as string);
		}
		this.consume(TokenType.DEDENT, "Ожидается конец блока перечисления");

		return {
			type: "EnumDeclaration",
			name,
			members,
		};
	}

	parseFunctionDeclaration(): FunctionDeclaration {
		this.consume(TokenType.KEYWORD, 'Ожидается "функция"');
		const nameTok = this.consume(TokenType.IDENTIFIER, "Ожидается имя функции");
		const name = nameTok.value as string;

		this.consume(TokenType.LPAREN, 'Ожидается "(" после имени функции');
		const parameters = this.parseParameterList();
		this.consume(TokenType.RPAREN, 'Ожидается ")" после параметров');

		let returnType: TypeAnnotation | undefined;
		if (this.match(TokenType.ARROW)) {
			this.next();
			returnType = this.parseType();
		}

		this.consume(TokenType.COLON, 'Ожидается ":" перед телом функции');
		this.consume(TokenType.INDENT, "Ожидается начало тела функции (отступ)");

		const body = this.parseBlock();
		this.consume(TokenType.DEDENT, "Ожидается конец тела функции");

		return {
			type: "FunctionDeclaration",
			name,
			parameters,
			returnType,
			body,
		};
	}

	parseParameterList(): Parameter[] {
		const params: Parameter[] = [];
		if (this.match(TokenType.RPAREN)) {
			return params;
		}

		do {
			const nameTok = this.consume(TokenType.IDENTIFIER, "Ожидается имя параметра");
			const name = nameTok.value as string;
			this.consume(TokenType.COLON, 'Ожидается ":" после имени параметра');
			const type = this.parseType();
			params.push({ type: "Parameter", name, typeAnnotation: type });
		} while (this.match(TokenType.COMMA) && this.next());

		return params;
	}

	parseType(): TypeAnnotation {
		const tok = this.consumeOneOf([TokenType.KEYWORD, TokenType.IDENTIFIER], "Ожидается название типа");
		return {
			type: "TypeAnnotation",
			name: tok.value as string,
		};
	}

	private consumeOneOf(types: TokenType[], message: string): Token {
		const tok = this.peek();
		if (!tok || !types.includes(tok.type)) {
			const found = tok ? `${TokenType[tok.type]} (${tok.value})` : "конец файла";
			throw new Error(
				`${message} — ожидался один из ${types.map((t) => TokenType[t]).join(", ")}, найдено ${found}`,
			);
		}
		return this.next();
	}

	parseBlock(): Block {
		const statements: Statement[] = [];
		while (!this.match(TokenType.DEDENT) && !this.isAtEnd()) {
			statements.push(this.parseStatement());
		}
		return {
			type: "Block",
			statements,
		};
	}

	parseStatement(): Statement {
		if (this.match(TokenType.KEYWORD)) {
			const kw = this.peek()!.value;
			switch (kw) {
				case "пока":
					return this.parseWhileStatement();
				case "вернуть":
					return this.parseReturnStatement();
				case "выбор":
					return this.parseSwitchStatement();
				case "если":
					return this.parseIfStatement();
				default:
					throw new Error(`Неожиданное ключевое слово: ${kw}`);
			}
		}

		return this.parseAssignmentOrCall();
	}

	parseIfStatement(): IfStatement {
		this.consume(TokenType.KEYWORD, 'Ожидается "если"');

		const condition = this.parseExpression();

		this.consume(TokenType.COLON, 'Ожидается ":" после условия');
		this.consume(TokenType.INDENT, "Ожидается начало блока (отступ)");
		const thenBranch = this.parseBlock();
		this.consume(TokenType.DEDENT, "Ожидается конец блока");

		let elseBranch: Block | undefined;
		if (this.match(TokenType.KEYWORD) && this.peek()!.value === "иначе") {
			this.next();
			this.consume(TokenType.COLON, 'Ожидается ":" после "иначе"');
			this.consume(TokenType.INDENT, "Ожидается начало блока иначе (отступ)");
			elseBranch = this.parseBlock();
			this.consume(TokenType.DEDENT, "Ожидается конец блока иначе");
		}

		return {
			type: "IfStatement",
			condition,
			thenBranch,
			elseBranch,
		};
	}

	parseWhileStatement(): WhileStatement {
		this.consume(TokenType.KEYWORD, 'Ожидается "пока"');
		const condition = this.parseExpression();
		this.consume(TokenType.COLON, 'Ожидается ":" после условия');
		this.consume(TokenType.INDENT, "Ожидается начало тела цикла (отступ)");
		const body = this.parseBlock();
		this.consume(TokenType.DEDENT, "Ожидается конец тела цикла");
		return {
			type: "WhileStatement",
			condition,
			body,
		};
	}

	parseReturnStatement(): ReturnStatement {
		this.consume(TokenType.KEYWORD, 'Ожидается "вернуть"');
		let argument: Expression | undefined;
		if (!this.match(TokenType.DEDENT) && !this.isAtEnd()) {
			argument = this.parseExpression();
		}
		return {
			type: "ReturnStatement",
			argument,
		};
	}

	parseSwitchStatement(): SwitchStatement {
		this.consume(TokenType.KEYWORD, 'Ожидается "выбор"');
		const discriminant = this.parseExpression();
		this.consume(TokenType.COLON, 'Ожидается ":" после выражения выбора');
		this.consume(TokenType.INDENT, "Ожидается начало блока выбора (отступ)");

		const cases: CaseClause[] = [];
		let defaultCase: Block | undefined;

		while (!this.match(TokenType.DEDENT) && !this.isAtEnd()) {
			if (this.match(TokenType.KEYWORD)) {
				const kw = this.peek()!.value;
				if (kw === "случай") {
					this.next();
					const valueTok = this.consume(TokenType.IDENTIFIER, "Ожидается имя варианта");
					const value = valueTok.value as string;
					this.consume(TokenType.COLON, 'Ожидается ":" после имени варианта');
					this.consume(TokenType.INDENT, "Ожидается начало блока варианта (отступ)");
					const body = this.parseBlock();
					this.consume(TokenType.DEDENT, "Ожидается конец блока варианта");
					cases.push({ type: "CaseClause", value, body });
				} else if (kw === "иначе") {
					this.next();
					this.consume(TokenType.COLON, 'Ожидается ":" после "иначе"');
					this.consume(TokenType.INDENT, 'Ожидается начало блока "иначе" (отступ)');
					defaultCase = this.parseBlock();
					this.consume(TokenType.DEDENT, 'Ожидается конец блока "иначе"');
				} else {
					throw new Error(`Неожиданное ключевое слово внутри выбора: ${kw}`);
				}
			} else {
				throw new Error('Ожидается "случай" или "иначе" внутри выбора');
			}
		}

		this.consume(TokenType.DEDENT, "Ожидается конец блока выбора");
		return {
			type: "SwitchStatement",
			discriminant,
			cases,
			defaultCase,
		};
	}

	parseAssignmentOrCall(): Statement {
		const leftTok = this.consume(TokenType.IDENTIFIER, "Ожидается идентификатор");
		const left: IdentifierExpression = {
			type: "IdentifierExpression",
			name: leftTok.value as string,
		};

		if (
			this.match(
				TokenType.ASSIGN,
				TokenType.ASSIGN_REF,
				TokenType.PLUS_ASSIGN,
				TokenType.MINUS_ASSIGN,
				TokenType.MULTIPLY_ASSIGN,
				TokenType.DIVIDE_ASSIGN,
			)
		) {
			const opTok = this.next();
			let operator: ":=" | "=" | "+=" | "-=" | "*=" | "/=";
			switch (opTok.type) {
				case TokenType.ASSIGN_REF:
					operator = ":=";
					break;
				case TokenType.ASSIGN:
					operator = "=";
					break;
				case TokenType.PLUS_ASSIGN:
					operator = "+=";
					break;
				case TokenType.MINUS_ASSIGN:
					operator = "-=";
					break;
				case TokenType.MULTIPLY_ASSIGN:
					operator = "*=";
					break;
				case TokenType.DIVIDE_ASSIGN:
					operator = "/=";
					break;
				default:
					throw new Error("Неизвестный оператор присваивания");
			}

			const right = this.parseExpression();
			return {
				type: "AssignmentStatement",
				left,
				operator,
				right,
			};
		}

		if (this.match(TokenType.LPAREN)) {
			this.next();
			const args = this.parseArgumentList();
			this.consume(TokenType.RPAREN, 'Ожидается ")" после аргументов');
			return {
				type: "ExpressionStatement",
				expression: {
					type: "CallExpression",
					callee: left,
					arguments: args,
				},
			};
		}

		throw new Error(`Неожиданный токен после идентификатора: ${this.peek()?.value}`);
	}

	parseExpression(): Expression {
		return this.parseComparison();
	}

	private parseComparison(): Expression {
		let left = this.parseAdditive();
		while (this.match(TokenType.LESS, TokenType.LESS_EQUAL, TokenType.EQUAL)) {
			const opTok = this.next();
			let operator: "<" | "<=" | "==";
			if (opTok.type === TokenType.LESS) operator = "<";
			else if (opTok.type === TokenType.LESS_EQUAL) operator = "<=";
			else operator = "==";

			const right = this.parseAdditive();
			left = {
				type: "BinaryExpression",
				left,
				operator,
				right,
			};
		}
		return left;
	}

	private parseAdditive(): Expression {
		let left = this.parseMultiplicative();
		while (this.match(TokenType.PLUS, TokenType.MINUS)) {
			const opTok = this.next();
			const operator = opTok.type === TokenType.PLUS ? "+" : "-";
			const right = this.parseMultiplicative();
			left = {
				type: "BinaryExpression",
				left,
				operator,
				right,
			};
		}
		return left;
	}

	private parseMultiplicative(): Expression {
		let left = this.parsePrimary();
		while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE)) {
			const opTok = this.next();
			const operator = opTok.type === TokenType.MULTIPLY ? "*" : "/";
			const right = this.parsePrimary();
			left = {
				type: "BinaryExpression",
				left,
				operator,
				right,
			};
		}
		return left;
	}

	private parsePrimary(): Expression {
		const tok = this.current();

		if (tok.type === TokenType.NUMBER) {
			this.next();
			return {
				type: "LiteralExpression",
				value: tok.value as number,
			};
		}

		if (tok.type === TokenType.STRING) {
			this.next();
			return {
				type: "LiteralExpression",
				value: tok.value as string,
			};
		}

		if (tok.type === TokenType.IDENTIFIER) {
			const name = tok.value as string;
			this.next();

			if (this.match(TokenType.LPAREN)) {
				this.next();
				const args = this.parseArgumentList();
				this.consume(TokenType.RPAREN, 'Ожидается ")" после аргументов');
				return {
					type: "CallExpression",
					callee: { type: "IdentifierExpression", name },
					arguments: args,
				};
			}

			return {
				type: "IdentifierExpression",
				name,
			};
		}

		if (tok.type === TokenType.LPAREN) {
			this.next();
			const expr = this.parseExpression();
			this.consume(TokenType.RPAREN, 'Ожидается ")" после выражения');
			return expr;
		}

		throw new Error(`Неожиданный токен в выражении: ${TokenType[tok.type]} (${tok.value})`);
	}

	private parseArgumentList(): Expression[] {
		const args: Expression[] = [];
		if (this.match(TokenType.RPAREN)) {
			return args;
		}

		do {
			args.push(this.parseExpression());
		} while (this.match(TokenType.COMMA) && this.next());

		return args;
	}
}
