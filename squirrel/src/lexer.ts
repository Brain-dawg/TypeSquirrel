import CharCode from './charCode';
import * as globals from './globals';

export const enum TokenKind {
	SKIP = -2,
	INVALID = -1,
	EOF = 0,

	LINE_FEED,
	LEFT_ROUND,
	RIGHT_ROUND,
	LEFT_CURLY,
	RIGHT_CURLY,
	LEFT_SQUARE,
	RIGHT_SQUARE,
	SEMICOLON,
	COMMA,
	TERNARY,
	BIT_XOR,
	BIT_NOT,
	DOT,
	COLON,
	PLUS,
	MINUS,
	MULTIPLY,
	DIVIDE,
	MODULO,
	BIT_AND,
	BIT_OR,
	LESS,
	GREATER,
	ASSIGN,
	NOT,
	LAMBDA,

	IDENTIFIER,
	STRING,
	VERBATIM_STRING,
	INTEGER,
	FLOAT,
	BASE,
	DELETE,
	EQUALS,
	NOT_EQUALS,
	LESS_EQUALS,
	GREATER_EQUALS,
	SWITCH,
	AND,
	OR,
	IF,
	ELSE,
	WHILE,
	BREAK,
	FOR,
	DO,
	NULL,
	FOREACH,
	IN,
	NEW_SLOT,
	LOCAL,
	CLONE,
	FUNCTION,
	RETURN,
	TYPEOF,
	UNARY_MINUS,
	PLUS_ASSIGN,
	MINUS_ASSIGN,
	CONTINUE,
	YIELD,
	TRY,
	CATCH,
	THROW,
	SHIFT_LEFT,
	SHIFT_RIGHT,
	RESUME,
	DOUBLE_COLON,
	CASE,
	DEFAULT,
	THIS,
	PLUS_PLUS,
	MINUS_MINUS,
	THREE_WAY_CMP,
	UNSIGNED_SHIFT_RIGHT,
	CLASS,
	EXTENDS,
	CONSTRUCTOR,
	INSTANCEOF,
	VARPARAMS,
	__LINE__,
	__FILE__,
	TRUE,
	FALSE,
	MULTIPLY_ASSIGN,
	DIVIDE_ASSIGN,
	MODULO_ASSIGN,
	ATTR_OPEN,
	ATTR_CLOSE,
	STATIC,
	ENUM,
	CONST,
	RAWCALL,

	LINE_COMMENT,
	BLOCK_COMMENT,
	DOC
};

export const tokenKindToString = new Map<TokenKind, string>([
	[TokenKind.EOF, 'EOF'],

	[TokenKind.LINE_FEED, 'line feed'],
	[TokenKind.LEFT_ROUND, '('],
	[TokenKind.RIGHT_ROUND, ')'],
	[TokenKind.LEFT_CURLY, '{'],
	[TokenKind.RIGHT_CURLY, '}'],
	[TokenKind.LEFT_SQUARE, '['],
	[TokenKind.RIGHT_SQUARE, ']'],
	[TokenKind.SEMICOLON, ';'],
	[TokenKind.COMMA, ','],
	[TokenKind.TERNARY, '?'],
	[TokenKind.BIT_XOR, '^'],
	[TokenKind.BIT_NOT, '~'],
	[TokenKind.DOT, '.'],
	[TokenKind.COLON, ':'],
	[TokenKind.PLUS, '+'],
	[TokenKind.MINUS, '-'],
	[TokenKind.MULTIPLY, '*'],
	[TokenKind.DIVIDE, '/'],
	[TokenKind.MODULO, '%'],
	[TokenKind.BIT_AND, '&'],
	[TokenKind.BIT_OR, '|'],
	[TokenKind.LESS, '<'],
	[TokenKind.GREATER, '>'],
	[TokenKind.ASSIGN, '='],
	[TokenKind.NOT, '!'],
	[TokenKind.LAMBDA, '@'],

	[TokenKind.EQUALS, '=='],
	[TokenKind.NOT_EQUALS, '!='],
	[TokenKind.LESS_EQUALS, '<='],
	[TokenKind.GREATER_EQUALS, '>='],
	[TokenKind.SHIFT_LEFT, '<<'],
	[TokenKind.SHIFT_RIGHT, '>>'],
	[TokenKind.UNSIGNED_SHIFT_RIGHT, '>>>'],
	[TokenKind.THREE_WAY_CMP, '<=>'],
	[TokenKind.NEW_SLOT, '<-'],
	[TokenKind.DOUBLE_COLON, '::'],
	[TokenKind.PLUS_ASSIGN, '+='],
	[TokenKind.MINUS_ASSIGN, '-='],
	[TokenKind.MULTIPLY_ASSIGN, '*='],
	[TokenKind.DIVIDE_ASSIGN, '/='],
	[TokenKind.MODULO_ASSIGN, '%='],
	[TokenKind.PLUS_PLUS, '++'],
	[TokenKind.MINUS_MINUS, '--'],
	[TokenKind.ATTR_OPEN, '</'],
	[TokenKind.ATTR_CLOSE, '/>'],
	[TokenKind.VARPARAMS, '...'],

	// Literals and Identifiers
	[TokenKind.IDENTIFIER, 'identifier'],
	[TokenKind.STRING, 'string'],
	[TokenKind.VERBATIM_STRING, 'string'],
	[TokenKind.INTEGER, 'integer'],
	[TokenKind.FLOAT, 'float'],

	// Keywords
	[TokenKind.IF, 'if'],
	[TokenKind.ELSE, 'else'],
	[TokenKind.WHILE, 'while'],
	[TokenKind.FOR, 'for'],
	[TokenKind.FOREACH, 'foreach'],
	[TokenKind.IN, 'in'],
	[TokenKind.BREAK, 'break'],
	[TokenKind.CONTINUE, 'continue'],
	[TokenKind.RETURN, 'return'],
	[TokenKind.TRY, 'try'],
	[TokenKind.CATCH, 'catch'],
	[TokenKind.THROW, 'throw'],
	[TokenKind.YIELD, 'yield'],
	[TokenKind.RESUME, 'resume'],
	[TokenKind.SWITCH, 'switch'],
	[TokenKind.CASE, 'case'],
	[TokenKind.DEFAULT, 'default'],

	[TokenKind.NULL, 'null'],
	[TokenKind.TRUE, 'true'],
	[TokenKind.FALSE, 'false'],
	[TokenKind.LOCAL, 'local'],
	[TokenKind.TYPEOF, 'typeof'],
	[TokenKind.INSTANCEOF, 'instanceof'],
	[TokenKind.CLONE, 'clone'],
	[TokenKind.FUNCTION, 'function'],
	[TokenKind.CLASS, 'class'],
	[TokenKind.CONSTRUCTOR, 'constructor'],
	[TokenKind.EXTENDS, 'extends'],
	[TokenKind.THIS, 'this'],
	[TokenKind.STATIC, 'static'],
	[TokenKind.ENUM, 'enum'],
	[TokenKind.CONST, 'const'],
	[TokenKind.RAWCALL, 'rawcall'],
	[TokenKind.DELETE, 'delete'],

	// Special tokens
	[TokenKind.__LINE__, '__LINE__'],
	[TokenKind.__FILE__, '__FILE__'],

]);

const keywords = new Map<string, TokenKind>([
	['while', TokenKind.WHILE],
	['do', TokenKind.DO],
	['if', TokenKind.IF],
	['else', TokenKind.ELSE],
	['break', TokenKind.BREAK],
	['continue', TokenKind.CONTINUE],
	['return', TokenKind.RETURN],
	['null', TokenKind.NULL],
	['function', TokenKind.FUNCTION],
	['local', TokenKind.LOCAL],
	['for', TokenKind.FOR],
	['foreach', TokenKind.FOREACH],
	['in', TokenKind.IN],
	['typeof', TokenKind.TYPEOF],
	['base', TokenKind.BASE],
	['delete', TokenKind.DELETE],
	['try', TokenKind.TRY],
	['catch', TokenKind.CATCH],
	['throw', TokenKind.THROW],
	['clone', TokenKind.CLONE],
	['yield', TokenKind.YIELD],
	['resume', TokenKind.RESUME],
	['switch', TokenKind.SWITCH],
	['case', TokenKind.CASE],
	['default', TokenKind.DEFAULT],
	['this', TokenKind.THIS],
	['class', TokenKind.CLASS],
	['extends', TokenKind.EXTENDS],
	['constructor', TokenKind.CONSTRUCTOR],
	['instanceof', TokenKind.INSTANCEOF],
	['true', TokenKind.TRUE],
	['false', TokenKind.FALSE],
	['static', TokenKind.STATIC],
	['enum', TokenKind.ENUM],
	['const', TokenKind.CONST],
	['__LINE__', TokenKind.__LINE__],
	['__FILE__', TokenKind.__FILE__],
	['rawcall', TokenKind.RAWCALL]
]);

export function isTokenAComment(token: Token): boolean {
	const kind = token.kind;
	return kind === TokenKind.LINE_COMMENT || kind === TokenKind.BLOCK_COMMENT || kind === TokenKind.DOC;
}

export function isTokenSkippable(token: Token): boolean {
	return isTokenAComment(token) || token.kind === TokenKind.LINE_FEED;
}

export function isTokenAString(token: Token): boolean {
	const kind = token.kind;
	return kind === TokenKind.STRING || kind === TokenKind.VERBATIM_STRING;
}


export interface TokenError {
	message: string,
	start: number,
	end: number
}

export interface Token {
	kind: TokenKind;
	value: string;
	start: number;
	end: number;
}

export interface StringToken extends Token {
	sourcePositions: number[];
	lexer?: Lexer;
}

type TokenFunction = () => TokenKind | Token;

type TokenMap = {
	[char: string]: TokenKind | TokenMap | TokenFunction;
} & {
	fallback: TokenKind;
};

export class Lexer {
	private readonly text: string;

	private cursor: number;
	private current: string;

	private readEOF: boolean;

	private previousToken?: Token;
	private currentToken?: Token;

	private readonly tokens: Token[];

	private readonly sourcePositions: number[];
	private sourcePositionIndex: number;
	private readonly sourcePositionBound: number;

	private readonly errors: TokenError[];

	constructor(text: string, sourcePositions?: number[]) {
		this.text = text;

		this.cursor = 0;
		this.current = '';
		this.readEOF = false;

		this.tokens = [];

		this.sourcePositions = sourcePositions ?? Array.from({ length: text.length + 1 }, (_, i) => i);
		this.sourcePositionIndex = 0;
		this.sourcePositionBound = this.sourcePositions.length - 1;

		this.errors = [];

		this.next();
	}

	private charCode(): number {
		if (this.readEOF) {
			return -1;
		}

		return this.current.charCodeAt(0);
	}

	private next(): void {
		if (this.readEOF) {
			return;
		}

		this.sourcePositionIndex++;

		this.current = this.text[this.cursor++];

		if (this.current === undefined) {
			this.readEOF = true;
			this.current = '';
		}
	}

	private getSourcePosition(offset: number = 0): number {
		const index = this.sourcePositionIndex + offset;

		return this.sourcePositions[Math.min(index, this.sourcePositionBound)];
	}

	public getPreviousToken(): Token | undefined {
		return this.previousToken;
	}

	public getErrors(): TokenError[] {
		return this.errors;
	}

	private newToken(token: Token): Token {
		const { kind, value, start, end } = token;
		if (kind === TokenKind.INVALID) {
			this.errors.push({ message: `Invalid token '${value}'`, start, end });
			return this.lex();
		}

		this.tokens.push(token);

		if (kind === TokenKind.LINE_FEED) {
			// The next cycle previousToken would be set to this one
			this.currentToken = token;
			return this.lex();
		};

		if (isTokenAComment(token)) {
			// we do not change our current token if our token is happens to be a comment
			return this.lex();
		}

		this.previousToken = this.currentToken;
		this.currentToken = token;
		return token;
	}

	public getTokens(): Token[] {
		return this.tokens;
	}

	public lex(): Token {
		let previousEntry: TokenMap;
		while (true) {
			if (this.readEOF) {
				const position = this.getSourcePosition();

				return this.newToken({ kind: TokenKind.EOF, value: '', start: position, end: position });
			}

			const entry = tokenMap[this.current];

			if (entry === undefined) {
				this.errors.push({ message: "Invalid character.", start: this.getSourcePosition(-1), end: this.getSourcePosition() });
				this.next();
				continue;
			}

			if (typeof entry === "number") {
				if (entry === TokenKind.SKIP) {
					this.next();
					continue;
				}

				const start = this.getSourcePosition(-1);
				const end = this.getSourcePosition();
				const textEnd = this.cursor;

				this.next();

				return this.newToken({ kind: entry, value: this.text.slice(textEnd - 1, textEnd), start, end });
			}

			if (typeof entry === "function") {
				const textStart = this.cursor - 1;
				const start = this.getSourcePosition(-1);
				const result = entry.call(this);

				if (typeof result === "number") {
					const end = this.getSourcePosition(-1);
					const textEnd = this.cursor - 1;

					return this.newToken({ kind: result, value: this.text.slice(textStart, textEnd), start, end });
				}

				return this.newToken(result);
			}

			this.next();
			previousEntry = entry;
			break;
		}

		const textStart = this.cursor - 2;
		const start = this.getSourcePosition(-2);
		while (true) {
			const entry = previousEntry[this.current];

			if (this.readEOF || entry === undefined) {
				const textEnd = this.cursor - 1;
				const end = this.getSourcePosition(-1);

				return this.newToken({ kind: previousEntry.fallback, value: this.text.slice(textStart, textEnd), start, end });
			}

			if (typeof entry === "number") {
				const textEnd = this.cursor;
				const end = this.getSourcePosition();
				this.next();
				return this.newToken({ kind: entry, value: this.text.slice(textStart, textEnd), start, end });
			}

			if (typeof entry === "function") {
				const result = entry.call(this);
				if (typeof result === "number") {
					const textEnd = this.cursor - 1;
					const end = this.getSourcePosition(-1);
					return this.newToken({ kind: result, value: this.text.slice(textStart, textEnd), start, end });
				}

				return this.newToken(result);
			}

			previousEntry = entry;
			this.next();
		}
	}

	public lexBlockComment(): TokenKind {
		let kind = TokenKind.BLOCK_COMMENT;
		this.next();
		if (this.charCode() === CharCode.ASTERISK) {
			this.next();
			if (this.charCode() === CharCode.SLASH) {
				this.next();
				return TokenKind.BLOCK_COMMENT;
			}
			kind = TokenKind.DOC;
		}
		while (!this.readEOF) {
			if (this.charCode() === CharCode.ASTERISK) {
				this.next();
				if (this.charCode() === CharCode.SLASH) {
					this.next();
					return kind;
				}
				continue;
			}
			this.next();
		}
		this.errors.push({ message: "'*/' expected.", start: this.getSourcePosition(-1), end: this.getSourcePosition() });

		return kind;
	}

	public lexLineComment(): TokenKind {
		do {
			this.next();
		} while (!this.readEOF && this.charCode() !== CharCode.LINE_FEED);

		return TokenKind.LINE_COMMENT;
	}

	public lexVerbatimString(): StringToken {
		const start = this.getSourcePosition(-2);
		const opening = this.charCode();
		const kind = TokenKind.VERBATIM_STRING;
		const sourcePositions: number[] = [this.getSourcePosition()];

		let value = "";
		
		do {
			this.next();
			if (this.charCode() === opening) {
				this.next();
				if (this.charCode() !== opening) {
					const end = this.getSourcePosition();
					return { kind, value, start, end, sourcePositions };
				}
			}
			value += this.current;
			sourcePositions.push(this.getSourcePosition());
		} while (!this.readEOF);

		const end = this.getSourcePosition();
		this.errors.push({ message: "Unterminated string literal.", start: this.getSourcePosition(-1), end });

		return { kind, value, start, end, sourcePositions };
	}

	public processHexEscape(maxDigits: number): string {
		const textStart = this.cursor;
		this.next();
		const charCode = this.charCode();
		if (!CharCode.isHexadecimal(charCode)) {
			this.errors.push({ message: "Hexadecimal number expected.", start: this.getSourcePosition(-1), end: this.getSourcePosition() });
			return "";
		}
		for (let i = 1; i < maxDigits; i++) {
			this.next();
			const charCode = this.charCode();
			if (!CharCode.isHexadecimal(charCode)) {
				const textEnd = this.cursor - 1;

				return String.fromCharCode(parseInt(this.text.slice(textStart, textEnd), 16));
			}
		}
		
		const textEnd = this.cursor;
		this.next();
		return String.fromCharCode(parseInt(this.text.slice(textStart, textEnd), 16));
	}

	public lexString(): StringToken | Token {
		const start = this.getSourcePosition(-1);
		const opening = this.charCode();
		const kind = opening === CharCode.QUOTE ? TokenKind.INTEGER : TokenKind.STRING;
		const sourcePositions: number[] = [this.getSourcePosition()];

		let value = "";
		
		this.next();
		while (!this.readEOF) {
			const charCode = this.charCode();

			switch (charCode) {
			case CharCode.LINE_FEED:
				this.errors.push({ message: `Multiline in a ${kind === TokenKind.STRING ? "string" : "character"} literal.`, start: this.getSourcePosition(-1), end: this.getSourcePosition(-1) });
				break;
			case CharCode.BACKTICK:
				value += '"';
				break;
			case CharCode.BACKSLASH:
				this.next();
				switch (this.charCode()) {
				case CharCode.x:
					value += this.processHexEscape(2);	
					sourcePositions.push(this.getSourcePosition(-1));
					continue;
				case CharCode.u:
					value += this.processHexEscape(4);
					sourcePositions.push(this.getSourcePosition(-1));
					continue;
				case CharCode.U:
					value += this.processHexEscape(8);
					sourcePositions.push(this.getSourcePosition(-1));
					continue;
				case CharCode.t:
					value += '\t';
					break;
				case CharCode.a:
					value += '\x07';
					break;
				case CharCode.b:
					value += '\b';
					break;
				case CharCode.n:
					value += '\n';
					break;
				case CharCode.r:
					value += '\r';
					break;
				case CharCode.v:
					value += '\v';
					break;
				case CharCode.f:
					value += '\f';
					break;
				case CharCode.N0:
					value += '\0';
					break;
				case CharCode.BACKSLASH:
					value += '\\';
					break;
				case CharCode.QUOTE:
					value += '\'';
					break;
				case CharCode.DOUBLE_QUOTE:
					value += '"';
					break;
				case CharCode.BACKTICK:
					// ` is converted into \", so \` gets us \\", which means that after escaping the result would be \"
					value += '\\"';

					sourcePositions.push(this.getSourcePosition(-1));
					break;
				default:
					this.errors.push({ message: "Unrecognised escape character.", start: this.getSourcePosition(-2), end: this.getSourcePosition() });
				}
				break;
			case opening:
				const end = this.getSourcePosition();
				if (kind === TokenKind.STRING) {
					this.next();
					return { kind, value, start, end, sourcePositions };
				}

				if (value.length === 0) {
					this.errors.push({ message: "Character literal should contain a character.", start, end: this.getSourcePosition() });
					this.next();
					return { kind, value: '0', start, end };
				}

				if (value.length > 1) {
					this.errors.push({ message: "Character literal can only contain a single character.", start, end: this.getSourcePosition() });
				}

				this.next();
				return { kind, value: value.charCodeAt(0).toString(), start, end };
			default:
				value += this.current;
				break;
			}
			sourcePositions.push(this.getSourcePosition());
			this.next();
		}

		const end = this.getSourcePosition();
		this.errors.push({ message: `Unterminated ${kind === TokenKind.STRING ? "string" : "character"} literal.`, start: this.getSourcePosition(-1), end });
		return { kind, value, start, end, sourcePositions };
	}

	public lexNumber(): Token {
		const textStart = this.cursor - 1;
		const start = this.getSourcePosition(-1);
		const first = this.charCode();
		let kind = TokenKind.INTEGER;

		this.next();
		let charCode = this.charCode();
		if (first === CharCode.N0) {
			if (CharCode.isOctal(charCode)) {
				const value = this.lexOctal();
				const end = this.getSourcePosition(-1);
				return { kind, value, start, end };
			} else if (charCode === CharCode.x || charCode === CharCode.X) {
				const value = this.lexHexadecimal();
				const end = this.getSourcePosition(-1);
				return { kind, value, start, end };
			}
		}

		while (!this.readEOF) {
			if (charCode === CharCode.DOT) {
				kind = TokenKind.FLOAT;
			} else if (charCode === CharCode.e || charCode === CharCode.E) {
				kind = TokenKind.FLOAT;

				this.next();
				charCode = this.charCode();
				if (charCode === CharCode.MINUS || charCode === CharCode.PLUS) {
					this.next();
					charCode = this.charCode();
				}

				if (!CharCode.isNumeric(charCode)) {
					if (charCode === CharCode.DOT) {
						// read the float number till the end
						do {
							this.next();
							charCode = this.charCode();
							if (CharCode.isNumeric(charCode) || charCode === CharCode.DOT) {
								continue;
							}
							if (charCode === CharCode.e || charCode === CharCode.E) {
								this.next();
								charCode = this.charCode();
								if (charCode === CharCode.MINUS || charCode === CharCode.PLUS) {
									continue;
								}
								break;
							}
							break;
						} while (!this.readEOF);
					}

					this.errors.push({ message: "Exponent expected.", start, end: this.getSourcePosition() });
					break;
				}
			} else if (!CharCode.isNumeric(charCode)) {
				break;
			}

			this.next();
			charCode = this.charCode();
		}

		const textEnd = this.cursor - 1;
		const end = this.getSourcePosition(-1);
		return { kind, value: this.text.slice(textStart, textEnd), start, end };
	}


	public lexOctal(): string {
		const start = this.getSourcePosition(-2);
		let charCode = this.charCode();
		let result = charCode - CharCode.N0;
		do {
			this.next();
			charCode = this.charCode();
			if (!CharCode.isOctal(charCode)) {
				if (CharCode.isNumeric(charCode)) {
					do {
						this.next();
						charCode = this.charCode();
					} while (CharCode.isNumeric(charCode) && !this.readEOF);

					this.errors.push({ message: "Invalid octal number.", start, end: this.getSourcePosition() });
				}
				break;
			}

			result = result * 8 + (charCode - CharCode.N0);
		} while (!this.readEOF);

		return result.toString();
	}

	public lexHexadecimal(): string {
		const start = this.getSourcePosition(-2);
		let result = 0;
		do {
			this.next();
			let charCode = this.charCode();
			if (!CharCode.isHexadecimal(charCode)) {
				if (CharCode.isAlphaNumeric(charCode)) {
					do {
						this.next();
						charCode = this.charCode();
					} while (CharCode.isAlphaNumeric(charCode) && !this.readEOF);

					this.errors.push({ message: "Invalid hexadecimal number.", start, end: this.getSourcePosition() });
				}

				break;
			}

			if (CharCode.isNumeric(charCode)) {
				result = result * 16 + (charCode - CharCode.N0);
			} else {
				const upper = CharCode.toUpper(charCode);
				result = result * 16 + (upper - CharCode.A + 10);
			}
		} while (!this.readEOF);

		return result.toString();
	}

	public lexIdentifier(): Token {
		const textStart = this.cursor - 1;
		const start = this.getSourcePosition(-1);
		do {
			this.next();
		} while (!this.readEOF && CharCode.isAlphaNumeric(this.charCode()));
		const textEnd = this.cursor - 1;
		const end = this.getSourcePosition(-1);

		const value = this.text.slice(textStart, textEnd);
		return { kind: keywords.get(value) ?? TokenKind.IDENTIFIER, value, start, end };
	}

	public findTokenAtPosition(offset: number): { token: Token | null, index: number, lexer: Lexer } {
		let left = 0;
		let right = this.tokens.length - 1;

		while (left <= right) {
			const mid = Math.floor((left + right) / 2);
			const token = this.tokens[mid];

			if (offset < token.start) {
				right = mid - 1;
			} else if (offset >= token.end) {
				left = mid + 1;
			} else {
				// Found embedded squirrel
				if ("lexer" in token) {
					const code = token as StringToken;
					const lexer = code.lexer;
					if (lexer) {
						return lexer.findTokenAtPosition(offset);
					}
				}
				
				return { lexer: this, token, index: mid };
			}
		}

		// Not found: return the closest token to the left
		return { lexer: this, token: null, index: left - 1 };
	}
}

// Avoids creating a map every time the lexer is created
const tokenMap: Record<string, TokenKind | TokenMap | TokenFunction> = {
	'\r': TokenKind.SKIP,
	' ': TokenKind.SKIP,
	'\t': TokenKind.SKIP,
	'\n': TokenKind.LINE_FEED,
	'#': Lexer.prototype.lexLineComment,
	'/': {
		'*': Lexer.prototype.lexBlockComment,
		'/': Lexer.prototype.lexLineComment,
		'=': TokenKind.DIVIDE_ASSIGN,
		'>': TokenKind.ATTR_CLOSE,
		fallback: TokenKind.DIVIDE
	},
	'=': {
		'=': TokenKind.EQUALS,
		fallback: TokenKind.ASSIGN
	},
	'<': {
		'=': {
			'>': TokenKind.THREE_WAY_CMP,
			fallback: TokenKind.LESS_EQUALS
		},
		'-': TokenKind.NEW_SLOT,
		'<': TokenKind.SHIFT_LEFT,
		'/': TokenKind.ATTR_CLOSE,
		fallback: TokenKind.LESS
	},
	'>': {
		'=': TokenKind.GREATER_EQUALS,
		'>': {
			'>': TokenKind.UNSIGNED_SHIFT_RIGHT,
			fallback: TokenKind.SHIFT_RIGHT
		},
		fallback: TokenKind.GREATER
	},
	'!': {
		'=': TokenKind.NOT_EQUALS,
		fallback: TokenKind.NOT
	},
	'@': {
		'"': Lexer.prototype.lexVerbatimString,
		'`': Lexer.prototype.lexVerbatimString,
		fallback: TokenKind.LAMBDA
	},
	'"': Lexer.prototype.lexString,
	'\'': Lexer.prototype.lexString,
	'`': Lexer.prototype.lexString,
	'{': TokenKind.LEFT_CURLY,
	'}': TokenKind.RIGHT_CURLY,
	'(': TokenKind.LEFT_ROUND,
	')': TokenKind.RIGHT_ROUND,
	'[': TokenKind.LEFT_SQUARE,
	']': TokenKind.RIGHT_SQUARE,
	';': TokenKind.SEMICOLON,
	',': TokenKind.COMMA,
	'?': TokenKind.TERNARY,
	'^': TokenKind.BIT_XOR,
	'~': TokenKind.BIT_NOT,
	'.': {
		'.': {
			'.': TokenKind.VARPARAMS,
			fallback: TokenKind.INVALID,
		},
		fallback: TokenKind.DOT
	},
	'&': {
		'&': TokenKind.AND,
		fallback: TokenKind.BIT_AND
	},
	'|': {
		'|': TokenKind.OR,
		fallback: TokenKind.BIT_OR
	},
	':': {
		':': TokenKind.DOUBLE_COLON,
		fallback: TokenKind.COLON
	},
	'*': {
		'=': TokenKind.MULTIPLY_ASSIGN,
		fallback: TokenKind.MULTIPLY
	},
	'%': {
		'=': TokenKind.MODULO_ASSIGN,
		fallback: TokenKind.MODULO
	},
	'-': {
		'-': TokenKind.MINUS_MINUS,
		'=': TokenKind.MINUS_ASSIGN,
		fallback: TokenKind.MINUS
	},
	'+': {
		'+': TokenKind.PLUS_PLUS,
		'=': TokenKind.PLUS_ASSIGN,
		fallback: TokenKind.PLUS
	},

	// Whoopsie
	// Identifier
	'a': Lexer.prototype.lexIdentifier,
	'b': Lexer.prototype.lexIdentifier,
	'c': Lexer.prototype.lexIdentifier,
	'd': Lexer.prototype.lexIdentifier,
	'e': Lexer.prototype.lexIdentifier,
	'f': Lexer.prototype.lexIdentifier,
	'g': Lexer.prototype.lexIdentifier,
	'h': Lexer.prototype.lexIdentifier,
	'i': Lexer.prototype.lexIdentifier,
	'j': Lexer.prototype.lexIdentifier,
	'k': Lexer.prototype.lexIdentifier,
	'l': Lexer.prototype.lexIdentifier,
	'm': Lexer.prototype.lexIdentifier,
	'n': Lexer.prototype.lexIdentifier,
	'o': Lexer.prototype.lexIdentifier,
	'p': Lexer.prototype.lexIdentifier,
	'q': Lexer.prototype.lexIdentifier,
	'r': Lexer.prototype.lexIdentifier,
	's': Lexer.prototype.lexIdentifier,
	't': Lexer.prototype.lexIdentifier,
	'u': Lexer.prototype.lexIdentifier,
	'v': Lexer.prototype.lexIdentifier,
	'w': Lexer.prototype.lexIdentifier,
	'x': Lexer.prototype.lexIdentifier,
	'y': Lexer.prototype.lexIdentifier,
	'z': Lexer.prototype.lexIdentifier,

	'A': Lexer.prototype.lexIdentifier,
	'B': Lexer.prototype.lexIdentifier,
	'C': Lexer.prototype.lexIdentifier,
	'D': Lexer.prototype.lexIdentifier,
	'E': Lexer.prototype.lexIdentifier,
	'F': Lexer.prototype.lexIdentifier,
	'G': Lexer.prototype.lexIdentifier,
	'H': Lexer.prototype.lexIdentifier,
	'I': Lexer.prototype.lexIdentifier,
	'J': Lexer.prototype.lexIdentifier,
	'K': Lexer.prototype.lexIdentifier,
	'L': Lexer.prototype.lexIdentifier,
	'M': Lexer.prototype.lexIdentifier,
	'N': Lexer.prototype.lexIdentifier,
	'O': Lexer.prototype.lexIdentifier,
	'P': Lexer.prototype.lexIdentifier,
	'Q': Lexer.prototype.lexIdentifier,
	'R': Lexer.prototype.lexIdentifier,
	'S': Lexer.prototype.lexIdentifier,
	'T': Lexer.prototype.lexIdentifier,
	'U': Lexer.prototype.lexIdentifier,
	'V': Lexer.prototype.lexIdentifier,
	'W': Lexer.prototype.lexIdentifier,
	'X': Lexer.prototype.lexIdentifier,
	'Y': Lexer.prototype.lexIdentifier,
	'Z': Lexer.prototype.lexIdentifier,

	'_': Lexer.prototype.lexIdentifier,

	// Numbers
	'0': Lexer.prototype.lexNumber,
	'1': Lexer.prototype.lexNumber,
	'2': Lexer.prototype.lexNumber,
	'3': Lexer.prototype.lexNumber,
	'4': Lexer.prototype.lexNumber,
	'5': Lexer.prototype.lexNumber,
	'6': Lexer.prototype.lexNumber,
	'7': Lexer.prototype.lexNumber,
	'8': Lexer.prototype.lexNumber,
	'9': Lexer.prototype.lexNumber
};

export class TokenIterator {
	private tokens: Token[];
	private index: number;

	constructor(tokens: Token[], index = 0) {
		this.tokens = tokens;
		this.index = index;
	}

	public hasNext(): boolean {
		return this.index < this.tokens.length;
	}

	public next(): Token {
		const token = this.tokens[this.index];
		this.index++;
		return token;
	}

	public hasPrevious(): boolean {
		return this.index > -1;
	}

	public previous(): Token {
		const token = this.tokens[this.index];
		this.index--;
		return token;
	}

	public reset(): void {
		this.index = 0;
	}

	public setIndex(index: number): void {
		this.index = index;
	}

	public getIndex(): number {
		return this.index;
	}

	public readIdentity(multiline = true): string | null {
		while (this.hasPrevious()) {
			const token = this.previous();
			if (isTokenAComment(token)) {
				continue;
			}

			if (multiline && token.kind === TokenKind.LINE_FEED) {
				continue;
			}

			if (token.kind === TokenKind.IDENTIFIER) {
				return token.value;
			}

			this.next();
			break;
		}

		return null;
	}

	public hasDot(): boolean {
		while (this.hasPrevious()) {
			const token = this.previous();
			if (isTokenAComment(token) || token.kind === TokenKind.LINE_FEED) {
				continue;
			}

			if (token.kind === TokenKind.DOT) {
				return true;
			}

			break;
		}

		return false;
	}

	public findMethodDoc(methodName: string | null = null): globals.Doc | undefined {
		if (!methodName) {
			methodName = this.readIdentity();
			if (!methodName) {
				return;
			}
		}

		if (!this.hasDot()) {
			const entry =
				globals.functions.get(methodName) ||
				globals.deprecatedFunctions.get(methodName);

			if (entry) {
				return entry;
			}

			for (const methods of globals.instancesMethods.values()) {
				const entry = methods.get(methodName);
				if (entry) {
					return entry;
				}
			}

			return;
		}

		const instanceName = this.readIdentity();

		if (instanceName) {
			const entry = globals.instancesMethods.get(instanceName);
			if (entry) {
				return entry.get(methodName);
			}
		}

		return globals.methods.get(methodName) ||
			globals.deprecatedMethods.get(methodName);
	}

	public findDoc(name: string | null = null): globals.Doc | undefined {
		if (!name) {
			name = this.readIdentity();
			if (!name) {
				return;
			}
		}

		const entry = globals.events.get(name);
		if (entry) {
			return entry;
		}

		if (!this.hasDot()) {
			const entry =
				globals.functions.get(name) ||
				globals.deprecatedFunctions.get(name) ||
				globals.builtInConstants.get(name) ||
				globals.builtInVariables.get(name);

			if (entry) {
				return entry;
			}

			for (const methods of globals.instancesMethods.values()) {
				const entry = methods.get(name);
				if (entry) {
					return entry;
				}
			}

			for (const members of globals.instancesVariables.values()) {
				const entry = members.get(name);
				if (entry) {
					return entry;
				}
			}

			return;
		}

		const instanceName = this.readIdentity();
		if (instanceName) {
			let entry = globals.instancesMethods.get(instanceName);
			if (entry) {
				return entry.get(name);
			}

			entry = globals.instancesVariables.get(instanceName);
			if (entry) {
				return entry.get(name);
			}
		}

		return globals.methods.get(name) ||
			globals.deprecatedMethods.get(name);
	}
}