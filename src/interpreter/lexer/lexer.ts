import { Token, TokenType } from "./tokens";

export function createLexer(code: string): Token[] {
	let pos = 0;

	const tokens: Token[] = [];
	const maxIterations = 10000;
	let iterations = 0;

	const indentStack: number[] = [0];
	let atLineStart = true;

	const keywords = new Set<string>([
		"алг",
		"перечисление",
		"функция",
		"процедура",
		"вернуть",
		"выбор",
		"случай",
		"иначе",
		"цикл",
		"пока",
		"целое",
		"дробное",
		"строка",
		"двоичное",
		"если",
	]);

	function isRussianLetter(char: string): boolean {
		const code = char.charCodeAt(0);
		return (code >= 0x430 && code <= 0x44f) || (code >= 0x410 && code <= 0x42f) || code === 0x451 || code === 0x401;
	}

	function isLetter(char: string): boolean {
		if (!char) return false;
		const code = char.charCodeAt(0);
		return isRussianLetter(char) || (code >= 0x61 && code <= 0x7a) || (code >= 0x41 && code <= 0x5a);
	}

	function isDigit(char: string): boolean {
		if (!char) return false;
		const code = char.charCodeAt(0);
		return code >= 0x30 && code <= 0x39;
	}

	function handleIndent(): void {
		let indent = 0;

		while (pos < code.length) {
			const ch = code[pos];
			if (ch === " ") {
				indent++;
				pos++;
			} else if (ch === "\t") {
				indent += 4;
				pos++;
			} else {
				break;
			}
		}

		if (pos >= code.length) {
			return;
		}

		const next = code[pos];

		if (next === "\n") {
			pos++;
			atLineStart = true;
			return;
		}

		if (next === "#") {
			while (pos < code.length && code[pos] !== "\n") {
				pos++;
			}
			if (pos < code.length && code[pos] === "\n") {
				pos++;
			}
			atLineStart = true;
			return;
		}

		const currentIndent = indentStack[indentStack.length - 1];

		if (indent > currentIndent) {
			tokens.push({ type: TokenType.INDENT, value: indent });
			indentStack.push(indent);
		} else if (indent < currentIndent) {
			while (indentStack.length > 0 && indentStack[indentStack.length - 1] > indent) {
				tokens.push({ type: TokenType.DEDENT, value: indentStack.pop()! });
			}
			if (indentStack[indentStack.length - 1] !== indent) {
				throw new Error(
					`Несоответствие отступа: ожидался уровень ${indentStack[indentStack.length - 1]}, найден ${indent}`,
				);
			}
		}

		atLineStart = false;
	}

	while (pos < code.length) {
		iterations++;
		if (iterations > maxIterations) {
			console.error("Превышено максимальное количество итераций");
			console.error(`Текущая позиция: ${pos}, символ: ${code[pos]}`);
			console.error(`Обработано токенов: ${tokens.length}`);
			break;
		}

		if (atLineStart) {
			handleIndent();
			if (atLineStart || pos >= code.length) {
				continue;
			}
		}

		let ch = code[pos];

		if (ch === " " || ch === "\t" || ch === "\r") {
			pos++;
			continue;
		}

		if (ch === "\n") {
			pos++;
			atLineStart = true;
			continue;
		}

		if (ch === "#") {
			while (pos < code.length && code[pos] !== "\n") pos++;
			continue;
		}

		if (isDigit(ch)) {
			let start = pos;
			while (pos < code.length && (isDigit(code[pos]) || code[pos] === ".")) {
				pos++;
			}
			tokens.push({
				type: TokenType.NUMBER,
				value: parseFloat(code.slice(start, pos)),
			});
			continue;
		}

		if (isLetter(ch) || ch === "_") {
			let start = pos;
			while (pos < code.length && (isLetter(code[pos]) || isDigit(code[pos]) || code[pos] === "_")) {
				pos++;
			}
			let word = code.slice(start, pos);
			tokens.push({
				type: keywords.has(word) ? TokenType.KEYWORD : TokenType.IDENTIFIER,
				value: word,
			});
			continue;
		}

		if (ch === "(") {
			tokens.push({ type: TokenType.LPAREN, value: "(" });
			pos++;
			continue;
		}

		if (ch === ")") {
			tokens.push({ type: TokenType.RPAREN, value: ")" });
			pos++;
			continue;
		}

		if (ch === ":") {
			if (code[pos + 1] === "=") {
				tokens.push({ type: TokenType.ASSIGN_REF, value: ":=" });
				pos += 2;
			} else {
				tokens.push({ type: TokenType.COLON, value: ":" });
				pos++;
			}
			continue;
		}

		if (ch === ".") {
			tokens.push({ type: TokenType.DOT, value: "." });
			pos++;
			continue;
		}

		if (ch === ",") {
			tokens.push({ type: TokenType.COMMA, value: "," });
			pos++;
			continue;
		}
		if (ch === "-" && code[pos + 1] === ">") {
			tokens.push({ type: TokenType.ARROW, value: "->" });
			pos += 2;
			continue;
		}
		if (ch === "-" && code[pos + 1] === "=") {
			tokens.push({ type: TokenType.MINUS_ASSIGN, value: "-=" });
			pos += 2;
			continue;
		}
		if (ch === "*" && code[pos + 1] === "=") {
			tokens.push({ type: TokenType.MULTIPLY_ASSIGN, value: "*=" });
			pos += 2;
			continue;
		}
		if (ch === "/" && code[pos + 1] === "=") {
			tokens.push({ type: TokenType.DIVIDE_ASSIGN, value: "/=" });
			pos += 2;
			continue;
		}
		if (ch === "-") {
			tokens.push({ type: TokenType.MINUS, value: "-" });
			pos++;
			continue;
		}
		if (ch === "*") {
			tokens.push({ type: TokenType.MULTIPLY, value: "*" });
			pos++;
			continue;
		}
		if (ch === "/") {
			tokens.push({ type: TokenType.DIVIDE, value: "/" });
			pos++;
			continue;
		}

		if (ch === "=") {
			if (code[pos + 1] === "=") {
				tokens.push({ type: TokenType.EQUAL, value: "==" });
				pos += 2;
			} else {
				tokens.push({ type: TokenType.ASSIGN, value: "=" });
				pos++;
			}
			continue;
		}

		if (ch === "+") {
			if (code[pos + 1] === "=") {
				tokens.push({ type: TokenType.PLUS_ASSIGN, value: "+=" });
				pos += 2;
			} else {
				tokens.push({ type: TokenType.PLUS, value: "+" });
				pos++;
			}
			continue;
		}

		if (ch === "<") {
			if (code[pos + 1] === "=") {
				tokens.push({ type: TokenType.LESS_EQUAL, value: "<=" });
				pos += 2;
			} else {
				tokens.push({ type: TokenType.LESS, value: "<" });
				pos++;
			}
			continue;
		}

		if (ch === ">") {
			if (code[pos + 1] === "=") {
				tokens.push({ type: TokenType.GREATER_EQUAL, value: ">=" });
				pos += 2;
			} else {
				tokens.push({ type: TokenType.GREATER, value: ">" });
				pos++;
			}
			continue;
		}

		if (ch === '"') {
			pos++;
			let start = pos;
			while (pos < code.length && code[pos] !== '"') {
				pos++;
			}

			if (pos >= code.length) {
				throw new Error("Незакрытая кавычка");
			}

			let str = code.slice(start, pos);
			tokens.push({ type: TokenType.STRING, value: str });
			pos++;
			continue;
		}

		throw new Error(`Неизвестный символ: "${ch}" (код: ${ch.charCodeAt(0)}) на позиции ${pos}`);
	}

	while (indentStack.length > 1) {
		tokens.push({ type: TokenType.DEDENT, value: indentStack.pop()! });
	}

	return tokens;
}
