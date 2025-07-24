import CharCode from './charCode';
import * as globals from './globals';
import { Doc, Token, Error, SyntaxKind, isTokenAComment, StringToken, reservedIdentifiers, } from './squirrel';

type TokenFunction = () => SyntaxKind | Token;

type TokenMap = {
	[char: string]: SyntaxKind | TokenMap | TokenFunction;
} & {
	fallback: SyntaxKind;
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
	private readonly errors: Error[];

	private readonly tokenMap: Record<string, SyntaxKind | TokenMap | TokenFunction> = {
		'\r': SyntaxKind.Skip,
		' ': SyntaxKind.Skip,
		'\t': SyntaxKind.Skip,
		'\n': SyntaxKind.LineFeedToken,
		'#': this.lexLineComment.bind(this),
		'/': {
			'*': this.lexBlockComment.bind(this),
			'/': this.lexLineComment.bind(this),
			'=': SyntaxKind.SlashEqualsToken,
			'>': SyntaxKind.SlashGreaterThanToken,
			fallback: SyntaxKind.SlashToken
		},
		'=': {
			'=': SyntaxKind.EqualsEqualsToken,
			fallback: SyntaxKind.EqualsToken
		},
		'<': {
			'=': {
				'>': SyntaxKind.LessThanEqualsGreaterThanToken,
				fallback: SyntaxKind.LessThanEqualsToken
			},
			'-': SyntaxKind.LessMinusToken,
			'<': SyntaxKind.LessThanLessThanToken,
			'/': SyntaxKind.SlashGreaterThanToken,
			fallback: SyntaxKind.LessThanToken
		},
		'>': {
			'=': SyntaxKind.GreaterThanEqualsToken,
			'>': {
				'>': SyntaxKind.GreaterThanGreaterThanGreaterThanToken,
				fallback: SyntaxKind.GreaterThanGreaterThanToken
			},
			fallback: SyntaxKind.GreaterThanToken
		},
		'!': {
			'=': SyntaxKind.NotEqualsToken,
			fallback: SyntaxKind.ExclamationToken
		},
		'@': {
			'"': this.lexVerbatimString.bind(this),
			// '`': this.lexVerbatimString.bind(this),
			fallback: SyntaxKind.AtToken
		},
		'"': this.lexString.bind(this),
		'\'': this.lexString.bind(this),
		// '`': this.lexString.bind(this),
		'{': SyntaxKind.OpenCurlyToken,
		'}': SyntaxKind.CloseCurlyToken,
		'(': SyntaxKind.OpenRoundToken,
		')': SyntaxKind.CloseRoundToken,
		'[': SyntaxKind.OpenSquareToken,
		']': SyntaxKind.RightSquareToken,
		';': SyntaxKind.SemicolonToken,
		',': SyntaxKind.CommaToken,
		'?': SyntaxKind.QuestionToken,
		'^': SyntaxKind.CaretToken,
		'~': SyntaxKind.TildaToken,
		'.': {
			'.': {
				'.': SyntaxKind.DotDotDotToken,
				fallback: SyntaxKind.Invalid,
			},
			fallback: SyntaxKind.DotToken
		},
		'&': {
			'&': SyntaxKind.AmpersandAmpersandToken,
			fallback: SyntaxKind.AmpersandToken
		},
		'|': {
			'|': SyntaxKind.PipePipeToken,
			fallback: SyntaxKind.PipeToken
		},
		':': {
			':': SyntaxKind.ColonColonToken,
			fallback: SyntaxKind.ColonToken
		},
		'*': {
			'=': SyntaxKind.AsteriskEqualsToken,
			fallback: SyntaxKind.AsteriskToken
		},
		'%': {
			'=': SyntaxKind.PercentEqualsToken,
			fallback: SyntaxKind.PercentToken
		},
		'-': {
			'-': SyntaxKind.MinusMinusToken,
			'=': SyntaxKind.MinusEqualsToken,
			fallback: SyntaxKind.MinusToken
		},
		'+': {
			'+': SyntaxKind.PlusPlusToken,
			'=': SyntaxKind.PlusEqualsToken,
			fallback: SyntaxKind.PlusToken
		},

		// Whoopsie
		// Identifier
		'a': this.lexIdentifier.bind(this),
		'b': this.lexIdentifier.bind(this),
		'c': this.lexIdentifier.bind(this),
		'd': this.lexIdentifier.bind(this),
		'e': this.lexIdentifier.bind(this),
		'f': this.lexIdentifier.bind(this),
		'g': this.lexIdentifier.bind(this),
		'h': this.lexIdentifier.bind(this),
		'i': this.lexIdentifier.bind(this),
		'j': this.lexIdentifier.bind(this),
		'k': this.lexIdentifier.bind(this),
		'l': this.lexIdentifier.bind(this),
		'm': this.lexIdentifier.bind(this),
		'n': this.lexIdentifier.bind(this),
		'o': this.lexIdentifier.bind(this),
		'p': this.lexIdentifier.bind(this),
		'q': this.lexIdentifier.bind(this),
		'r': this.lexIdentifier.bind(this),
		's': this.lexIdentifier.bind(this),
		't': this.lexIdentifier.bind(this),
		'u': this.lexIdentifier.bind(this),
		'v': this.lexIdentifier.bind(this),
		'w': this.lexIdentifier.bind(this),
		'x': this.lexIdentifier.bind(this),
		'y': this.lexIdentifier.bind(this),
		'z': this.lexIdentifier.bind(this),

		'A': this.lexIdentifier.bind(this),
		'B': this.lexIdentifier.bind(this),
		'C': this.lexIdentifier.bind(this),
		'D': this.lexIdentifier.bind(this),
		'E': this.lexIdentifier.bind(this),
		'F': this.lexIdentifier.bind(this),
		'G': this.lexIdentifier.bind(this),
		'H': this.lexIdentifier.bind(this),
		'I': this.lexIdentifier.bind(this),
		'J': this.lexIdentifier.bind(this),
		'K': this.lexIdentifier.bind(this),
		'L': this.lexIdentifier.bind(this),
		'M': this.lexIdentifier.bind(this),
		'N': this.lexIdentifier.bind(this),
		'O': this.lexIdentifier.bind(this),
		'P': this.lexIdentifier.bind(this),
		'Q': this.lexIdentifier.bind(this),
		'R': this.lexIdentifier.bind(this),
		'S': this.lexIdentifier.bind(this),
		'T': this.lexIdentifier.bind(this),
		'U': this.lexIdentifier.bind(this),
		'V': this.lexIdentifier.bind(this),
		'W': this.lexIdentifier.bind(this),
		'X': this.lexIdentifier.bind(this),
		'Y': this.lexIdentifier.bind(this),
		'Z': this.lexIdentifier.bind(this),

		'_': this.lexIdentifier.bind(this),

		// Numbers
		'0': this.lexNumber.bind(this),
		'1': this.lexNumber.bind(this),
		'2': this.lexNumber.bind(this),
		'3': this.lexNumber.bind(this),
		'4': this.lexNumber.bind(this),
		'5': this.lexNumber.bind(this),
		'6': this.lexNumber.bind(this),
		'7': this.lexNumber.bind(this),
		'8': this.lexNumber.bind(this),
		'9': this.lexNumber.bind(this)
	};

	constructor(text: string, sourcePositions?: number[]) {
		this.text = text;

		this.cursor = 0;
		this.current = '';
		this.readEOF = false;

		this.tokens = [];

		this.sourcePositions = sourcePositions ?? Array.from({ length: text.length + 1 }, (_, i) => i);

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

		if (this.cursor !== this.text.length) {
			this.current = this.text[this.cursor++];
		} else {
			this.readEOF = true;
			this.current = '';
		}

		
	}

	private getSourcePosition(offset: number = 0): number {
		const index = this.cursor + offset;

		return this.sourcePositions[Math.min(index, this.sourcePositions.length - 1)];
	}

	public getPreviousToken(): Token | undefined {
		return this.previousToken;
	}

	public getErrors(): Error[] {
		return this.errors;
	}

	private newToken(token: Token): Token {
		const { kind, value, start, end } = token;
		if (kind === SyntaxKind.Invalid) {
			this.errors.push({ message: `Invalid token '${value}'`, start, end });
			return this.lex();
		}

		this.tokens.push(token);

		if (kind === SyntaxKind.LineFeedToken) {
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

				return this.newToken({ kind: SyntaxKind.EOF, value: '', start: position, end: position });
			}

			const entry = this.tokenMap[this.current];

			if (entry === undefined) {
				this.errors.push({ message: "Invalid character.", start: this.getSourcePosition(-1), end: this.getSourcePosition() });
				this.next();
				continue;
			}

			if (typeof entry === "number") {
				if (entry === SyntaxKind.Skip) {
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
				const result = entry();

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
				const result = entry();
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

	private lexBlockComment(): SyntaxKind {
		let kind = SyntaxKind.BlockComment;
		this.next();
		if (this.charCode() === CharCode.ASTERISK) {
			this.next();
			if (this.charCode() === CharCode.SLASH) {
				this.next();
				return SyntaxKind.BlockComment;
			}
			kind = SyntaxKind.DocComment;
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

	private lexLineComment(): SyntaxKind {
		do {
			this.next();
		} while (!this.readEOF && this.charCode() !== CharCode.LINE_FEED);

		return SyntaxKind.LineComment;
	}

	private lexVerbatimString(): StringToken {
		const start = this.getSourcePosition(-2);
		const opening = this.charCode();
		const kind = SyntaxKind.VerbatimStringToken;
		const sourcePositions: number[] = [this.getSourcePosition()];

		let value = "";
		
		do {
			this.next();
			const charCode = this.charCode();
			if (charCode === opening) {
				this.next();
				if (this.charCode() !== opening) {
					const end = this.getSourcePosition();
					return { kind, value, start, end, sourcePositions };
				}
			}

			value += charCode === CharCode.BACKTICK ? '"' : this.current;
			sourcePositions.push(this.getSourcePosition());
		} while (!this.readEOF);

		const end = this.getSourcePosition();
		this.errors.push({ message: "Unterminated string literal.", start: this.getSourcePosition(-1), end });

		return { kind, value, start, end, sourcePositions };
	}

	private processHexEscape(maxDigits: number): string {
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


	private lexString(): StringToken | Token {
		const start = this.getSourcePosition(-1);
		const opening = this.charCode();
		const kind = opening === CharCode.QUOTE ? SyntaxKind.IntegerToken : SyntaxKind.StringToken;
		const sourcePositions: number[] = [this.getSourcePosition()];

		let value = "";
		
		this.next();
		while (!this.readEOF) {
			let charCode = this.charCode();

			switch (charCode) {
			case opening:
				const end = this.getSourcePosition();
				if (kind === SyntaxKind.StringToken) {
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
			case CharCode.LINE_FEED:
				this.errors.push({ message: `Unterminated ${kind === SyntaxKind.StringToken ? "string" : "character"} literal.`, start: this.getSourcePosition(-1), end: this.getSourcePosition(-1) });
				return { kind, value, start, end: this.getSourcePosition(-2), sourcePositions };
			case CharCode.BACKTICK:
				value += '"';
				break;
			case CharCode.BACKSLASH:
				this.next();
				charCode = this.charCode();
				switch (charCode) {
				case CharCode.x:
					value += this.processHexEscape(2);	
					sourcePositions.push(this.getSourcePosition(-1));
					continue;
				case CharCode.u:
				case CharCode.U:
					const escape = this.processHexEscape(charCode === CharCode.u ? 4 : 8);
					sourcePositions.push(this.getSourcePosition(-1));
					if (kind === SyntaxKind.IntegerToken && escape.charCodeAt(0) > 0x7F) {
						this.errors.push({ message: "Unicode characters take multiple bytes to store.", start, end: this.getSourcePosition() });
					}
					value += escape;
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
			default:
				value += this.current;
				break;
			}
			sourcePositions.push(this.getSourcePosition());
			this.next();
		}

		const end = this.getSourcePosition();
		this.errors.push({ message: `Unterminated ${kind === SyntaxKind.StringToken ? "string" : "character"} literal.`, start: this.getSourcePosition(-1), end });
		return { kind, value, start, end, sourcePositions };
	}

	private lexNumber(): Token {
		const textStart = this.cursor - 1;
		const start = this.getSourcePosition(-1);
		const first = this.charCode();
		let kind = SyntaxKind.IntegerToken;

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
				kind = SyntaxKind.FloatToken;
			} else if (charCode === CharCode.e || charCode === CharCode.E) {
				kind = SyntaxKind.FloatToken;

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


	private lexOctal(): string {
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

	private lexHexadecimal(): string {
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

	private lexIdentifier(): Token {
		const textStart = this.cursor - 1;
		const start = this.getSourcePosition(-1);
		do {
			this.next();
		} while (!this.readEOF && CharCode.isAlphaNumeric(this.charCode()));
		const textEnd = this.cursor - 1;
		const end = this.getSourcePosition(-1);

		const value = this.text.slice(textStart, textEnd);
		return { kind: reservedIdentifiers.get(value) ?? SyntaxKind.IdentifierToken, value, start, end };
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

			if (multiline && token.kind === SyntaxKind.LineFeedToken) {
				continue;
			}

			if (token.kind === SyntaxKind.IdentifierToken) {
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
			if (isTokenAComment(token) || token.kind === SyntaxKind.LineFeedToken) {
				continue;
			}

			if (token.kind === SyntaxKind.DotToken) {
				return true;
			}

			break;
		}

		return false;
	}

	public findMethodDoc(methodName: string | null = null): Doc | undefined {
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

	public findDoc(name: string | null = null): Doc | undefined {
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