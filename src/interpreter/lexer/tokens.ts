export enum TokenType {
	NUMBER = "NUMBER",
	STRING = "STRING",

	IDENTIFIER = "IDENTIFIER",
	KEYWORD = "KEYWORD",

	LPAREN = "LPAREN", // (
	RPAREN = "RPAREN", // )
	COLON = "COLON", // :
	DOT = "DOT", // .
	COMMA = "COMMA", // ,
	ARROW = "ARROW", // ->

	ASSIGN = "ASSIGN", // =
	ASSIGN_REF = "ASSIGN_REF", // :=
	PLUS = "PLUS", // +
	PLUS_ASSIGN = "PLUS_ASSIGN", // +=
	MINUS = "MINUS", // -
	MINUS_ASSIGN = "MINUS_ASSIGN", // -=
	MULTIPLY = "MULTIPLY", // *
	MULTIPLY_ASSIGN = "MULTIPLY_ASSIGN", // *=
	DIVIDE = "DIVIDE", // /
	DIVIDE_ASSIGN = "DIVIDE_ASSIGN", // /=
	LESS = "LESS", // <
	LESS_EQUAL = "LESS_EQUAL", // <=
	GREATER = "GREATER", // >
	GREATER_EQUAL = "GREATER_EQUAL", // >=
	EQUAL = "EQUAL", // ==

	INDENT = "INDENT",
	DEDENT = "DEDENT",
}

export interface Token {
	type: TokenType;
	value: string | number;
}

export const TokenDisplay: Record<TokenType, string> = {
	[TokenType.NUMBER]: "число",
	[TokenType.STRING]: "строка",
	[TokenType.IDENTIFIER]: "идентификатор",
	[TokenType.KEYWORD]: "ключевое_слово",
	[TokenType.LPAREN]: "(",
	[TokenType.RPAREN]: ")",
	[TokenType.COLON]: ":",
	[TokenType.DOT]: ".",
	[TokenType.COMMA]: ",",
	[TokenType.ARROW]: "->",
	[TokenType.ASSIGN]: "=",
	[TokenType.ASSIGN_REF]: ":=",
	[TokenType.PLUS]: "+",
	[TokenType.PLUS_ASSIGN]: "+=",
	[TokenType.MINUS]: "-",
	[TokenType.MINUS_ASSIGN]: "-=",
	[TokenType.MULTIPLY]: "*",
	[TokenType.MULTIPLY_ASSIGN]: "*=",
	[TokenType.DIVIDE]: "/",
	[TokenType.DIVIDE_ASSIGN]: "/=",
	[TokenType.LESS]: "<",
	[TokenType.LESS_EQUAL]: "<=",
	[TokenType.GREATER]: ">",
	[TokenType.GREATER_EQUAL]: ">=",
	[TokenType.EQUAL]: "==",
	[TokenType.INDENT]: "отступ",
	[TokenType.DEDENT]: "конец_отступа",
};

export function isKeyword(token: Token): boolean {
	return token.type === TokenType.KEYWORD;
}

export function isOperator(token: Token): boolean {
	return [
		TokenType.ASSIGN,
		TokenType.ASSIGN_REF,
		TokenType.PLUS,
		TokenType.PLUS_ASSIGN,
		TokenType.MINUS,
		TokenType.MINUS_ASSIGN,
		TokenType.MULTIPLY,
		TokenType.MULTIPLY_ASSIGN,
		TokenType.DIVIDE,
		TokenType.DIVIDE_ASSIGN,
		TokenType.LESS,
		TokenType.LESS_EQUAL,
		TokenType.GREATER,
		TokenType.GREATER_EQUAL,
		TokenType.EQUAL,
	].includes(token.type);
}

export function isLiteral(token: Token): boolean {
	return [TokenType.NUMBER, TokenType.STRING].includes(token.type);
}

export function isIdentifier(token: Token): boolean {
	return token.type === TokenType.IDENTIFIER;
}

export function tokenToString(token: Token): string {
	return `Token(${TokenType[token.type]}, ${token.value})`;
}
