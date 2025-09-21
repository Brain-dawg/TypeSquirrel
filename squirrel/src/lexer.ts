import CharCode from './charCode';
import * as globals from './globals';
import { Doc, Token, VScriptDiagnostic, StringTokenKind, SyntaxKind, isTokenAComment, StringToken, ReservedKeywords, isTokenAString, DiagnosticSeverity, ReadonlyTextRange, ValuedTokenKind, KeywordTokenKind, } from './types';
// Return null in case we want to continue the main loop
type TokenFunction = () => Token<ValuedTokenKind> | null;

type TokenValidator = SyntaxKind | TokenMap | TokenFunction

type TokenMap = {
	[char: string]: TokenValidator;
} & {
	fallback: TokenValidator;
};

const enum FloatStatus {
	None,
	FoundDot, // Can only meet numbers, e or E, after this point
	FoundE // Can only meet numbers after this point
}	

export class Lexer {
	private readonly text: string;

	private cursor: number;
	private current: string;

	private readEOF: boolean;

	private start: number;
	private textStart: number;

	private token?: Token<SyntaxKind>;
	private previousToken?: Token<SyntaxKind>;

	private doc: Token<SyntaxKind.DocComment> | undefined;
	private precedingLineBreak: boolean;

	private readonly tokens: Token<SyntaxKind>[];

	private readonly sourcePositions: number[];
	private readonly diagnostics: VScriptDiagnostic[];

	private readonly tokenMap: TokenMap = {
		'\r': this.lexTrivia.bind(this),
		' ': this.lexTrivia.bind(this),
		'\t': this.lexTrivia.bind(this),
		'\n': this.lexLineFeed.bind(this),
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
			'=': SyntaxKind.ExclamationEqualsToken,
			fallback: SyntaxKind.ExclamationToken
		},
		'@': {
			'"': this.lexVerbatimString.bind(this),
			// '`': this.lexVerbatimString.bind(this),
			fallback: SyntaxKind.AtToken
		},
		'"': this.lexStringOrCharacter.bind(this),
		'\'': this.lexStringOrCharacter.bind(this),
		// '`': this.lexString.bind(this),
		'{': SyntaxKind.OpenBraceToken,
		'}': SyntaxKind.CloseBraceToken,
		'(': SyntaxKind.OpenParenthesisToken,
		')': SyntaxKind.CloseParenthesisToken,
		'[': SyntaxKind.OpenBracketToken,
		']': SyntaxKind.CloseBracketToken,
		';': SyntaxKind.SemicolonToken,
		',': SyntaxKind.CommaToken,
		'?': SyntaxKind.QuestionToken,
		'^': SyntaxKind.CaretToken,
		'~': SyntaxKind.TildeToken,
		'.': {
			'.': {
				'.': SyntaxKind.DotDotDotToken,
				fallback: this.lexInvalidToken.bind(this)
			},
			fallback: SyntaxKind.DotToken
		},
		'&': {
			'&': SyntaxKind.AmpersandAmpersandToken,
			fallback: SyntaxKind.AmpersandToken
		},
		'|': {
			'|': SyntaxKind.BarBarToken,
			fallback: SyntaxKind.BarToken
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
		'9': this.lexNumber.bind(this),

		fallback: this.lexInvalidCharacter.bind(this)
	};

	constructor(text: string, sourcePositions?: number[]) {
		this.text = text;

		this.cursor = 0;
		this.current = '';
		this.readEOF = false;

		this.start = 0;
		this.textStart = 0;

		this.tokens = [];

		this.precedingLineBreak = false;

		this.sourcePositions = sourcePositions ?? Array.from({ length: text.length + 1 }, (_, i) => i);

		this.diagnostics = [];

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

		if (this.cursor < this.text.length) {
			this.current = this.text[this.cursor++];
		} else {
			this.readEOF = true;
			this.current = '';
			this.cursor++;
		}
	}

	public get lastToken(): Token<SyntaxKind> {
		return this.previousToken || {kind: SyntaxKind.Invalid, start: 0, end: 0} as Token<SyntaxKind.Invalid>;
	}

	public get hasPrecedingLineBreak(): boolean {
		return this.precedingLineBreak;
	}

	private getSourcePosition(offset: number = 0): number {
		const index = this.cursor + offset;

		return this.sourcePositions[Math.min(index, this.sourcePositions.length - 1)];
	}

	private diagnostic(message: string, start?: number, end?: number, severity: DiagnosticSeverity = DiagnosticSeverity.Error): void {
		if (start === undefined) {
			start = this.getSourcePosition(-1);
			end = this.getSourcePosition(0);
		} else if (end === undefined) {
			end = this.getSourcePosition(0);
		}
		
		const length = this.diagnostics.length;
		if (length === 0 || this.diagnostics[length - 1].start !== start) {
			this.diagnostics.push({
				start,
				end,
				message,
				severity
			});
		}
	}

	public getErrors(): VScriptDiagnostic[] {
		return this.diagnostics;
	}

	private advanceOrFallback(map: TokenMap): TokenValidator {
		if (this.current in map) {
			const current = this.current;
			this.next();
			return map[current];
		}
		return map.fallback;
	}

	private simpleToken<T extends SyntaxKind>(kind: T): Token<T> {
		const end = this.getSourcePosition(-1);
		return {
			kind,
			start: this.start,
			end
		} as Token<T>;
	}

	private textSliceToken<T extends ValuedTokenKind>(kind: T): Token<T> {
		const end = this.getSourcePosition(-1);
		const textEnd = this.cursor - 1;
		return {
			kind,
			start: this.start,
			end,
			value: this.text.slice(this.textStart, textEnd)
		} as Token<T>;
	}

	private tokenWithValue<T extends StringTokenKind>(kind: T, value: string, end: number, sourcePositions: number[]): StringToken<T>;
	private tokenWithValue<T extends ValuedTokenKind>(kind: T, value: string, end: number): Token<T>
	private tokenWithValue<T extends ValuedTokenKind>(kind: T, value: string, end: number, sourcePositions?: number[]): Token<T> | StringToken<StringTokenKind> {
		return {
			kind,
			start: this.start,
			end,
			value,
			sourcePositions
		} as T extends StringTokenKind ? StringToken<T> : Token<T>;
	}

	private finishToken<T extends SyntaxKind>(token: Token<T>): Token<T> {
		this.previousToken = this.token;

		this.tokens.push(token);
		if (this.doc) {
			token.doc = this.doc;
			this.doc = undefined;
		}
		
		return this.token = token;
	}

	public getTokens(): Token<SyntaxKind>[] {
		return this.tokens;
	}

	public lex(): Token<SyntaxKind> {
		if (this.readEOF) {
			if (this.tokens.length !== 0) {
				const lastToken = this.tokens[this.tokens.length - 1];
				if (lastToken.kind === SyntaxKind.EndOfFileToken) {
					return lastToken;
				} 
			}
			return this.finishToken(this.lexEndOfFileToken());
		}

		this.precedingLineBreak = false;

		let previousEntry: TokenMap | undefined;

		while (true) {
			let entry: TokenMap | SyntaxKind | TokenFunction;
			if (!previousEntry) {
				this.start = this.getSourcePosition(-1);
				this.textStart = this.cursor - 1;

				entry = this.advanceOrFallback(this.tokenMap);
			} else if (this.readEOF) {
				entry = previousEntry.fallback;
			} else {
				entry = this.advanceOrFallback(previousEntry);
			}
			
			if (typeof entry === "number") {
				return this.finishToken(this.simpleToken(entry));
			}

			if (typeof entry === "function") {
				const token = entry();
				if (!token) {
					if (this.readEOF) {
						return this.finishToken(this.lexEndOfFileToken());
					}

					previousEntry = undefined;
					continue;
				}

				return this.finishToken(token);
			}

			previousEntry = entry;
		}
	}

	private lexEndOfFileToken(): Token<SyntaxKind.EndOfFileToken> {
		const position = this.getSourcePosition();
		return {
			kind: SyntaxKind.EndOfFileToken,
			start: position,
			end: position
		} as Token<SyntaxKind.EndOfFileToken>;
	}

	private lexTrivia(): null {
		return null;
	}

	private lexLineFeed(): null {
		const token = this.simpleToken(SyntaxKind.LineFeedToken);
		this.tokens.push(token);
		this.precedingLineBreak = true;
		return null;
	}

	private lexInvalidCharacter(): null {
		this.diagnostic("Invalid character.", this.start);
		this.next();
		return null;
	}

	private lexInvalidToken(): null {
		this.diagnostic("Invalid token.", this.start, this.getSourcePosition(-1));
		return null;
	}

	private lexBlockComment(): null {
		let kind = SyntaxKind.BlockComment;
		if (this.charCode() === CharCode.ASTERISK) {
			this.next();
			// /**/
			if (this.charCode() === CharCode.SLASH) {
				this.next();

				const token = this.textSliceToken(kind);
				this.tokens.push(token);
				return null;
			}
			kind = SyntaxKind.DocComment;
		}

		while (!this.readEOF) {
			if (this.charCode() === CharCode.ASTERISK) {
				this.next();
				if (this.charCode() !== CharCode.SLASH) {	
					continue;
				}
				
				this.next();

				const token = this.textSliceToken(kind);
				if (kind === SyntaxKind.DocComment) {
					this.doc = token as Token<SyntaxKind.DocComment>;
				}
				this.tokens.push(token);
				return null;
			}
			this.next();
		}

		this.diagnostic("'*/' expected.", this.getSourcePosition());
		const token = this.textSliceToken(kind);
		if (kind === SyntaxKind.DocComment) {
			this.doc = token as Token<SyntaxKind.DocComment>;
		}
		this.tokens.push(token);
		return null;
	}

	private lexLineComment(): null {
		while (!this.readEOF && this.charCode() !== CharCode.LINE_FEED) {
			this.next();
		}

		const token = this.textSliceToken(SyntaxKind.LineComment);
		this.tokens.push(token);
		return null;
	}

	private lexVerbatimString(): StringToken<SyntaxKind.VerbatimStringToken> {
		const opening = this.text.charCodeAt(this.textStart + 1);
		const kind = SyntaxKind.VerbatimStringToken;
		
		const sourcePositions: number[] = [this.getSourcePosition(-1)];

		let value = "";
		while (!this.readEOF) {
			const charCode = this.charCode();
			if (charCode === opening) {
				this.next();
				if (this.charCode() !== opening) {
					return this.tokenWithValue(kind, value, this.getSourcePosition(-1), sourcePositions);
				}
			}

			value += charCode === CharCode.BACKTICK ? '"' : this.current;
			sourcePositions.push(this.getSourcePosition());
			this.next();
		}

		this.diagnostic("Unterminated string literal.");

		return this.tokenWithValue(kind, value, this.getSourcePosition(), sourcePositions);
	}

	private lexStringOrCharacter(): StringToken<SyntaxKind.StringToken> | Token<SyntaxKind.IntegerToken> {
		const opening = this.text.charCodeAt(this.textStart);
		const kind = opening === CharCode.QUOTE ? SyntaxKind.IntegerToken : SyntaxKind.StringToken;
		const sourcePositions: number[] = [this.getSourcePosition(-1)];
		
		let value = "";
		
		while (!this.readEOF) {
			let charCode = this.charCode();

			switch (charCode) {
			case opening:
				const end = this.getSourcePosition();
				if (kind === SyntaxKind.StringToken) {
					this.next();
					return this.tokenWithValue(kind, value, this.getSourcePosition(-1), sourcePositions);
				}

				if (value.length === 0) {
					this.diagnostic("Hexadecimal number expected.", this.start);
					this.next();
					return this.tokenWithValue(kind, '0', this.getSourcePosition(-1));
				}

				if (value.length > 1) {
					this.diagnostic("Character literal can only contain a single character.", this.start);
				}

				this.next();
				return this.tokenWithValue(kind, value.charCodeAt(0).toString(), this.getSourcePosition(-1));
			case CharCode.LINE_FEED:
				if (kind === SyntaxKind.StringToken) {
					this.diagnostic("Unterminated string literal.");
					return this.tokenWithValue(kind, value, this.getSourcePosition(-2), sourcePositions);
				} else {
					this.diagnostic("Unterminated character literal.");
					return this.tokenWithValue(kind, value, this.getSourcePosition(-2));
				}
			case CharCode.BACKTICK:
				value += '"';
				break;
			case CharCode.BACKSLASH:
				this.next();
				charCode = this.charCode();
				switch (charCode) {
				case CharCode.x:
					value += this.lexHexEscape(2);	
					sourcePositions.push(this.getSourcePosition(-1));
					continue;
				case CharCode.u:
				case CharCode.U:
					const escape = this.lexHexEscape(charCode === CharCode.u ? 4 : 8);
					sourcePositions.push(this.getSourcePosition(-1));
					if (kind === SyntaxKind.IntegerToken && escape.charCodeAt(0) > 0x7F) {
						this.diagnostic("Unicode characters take multiple bytes to store.", this.start);
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
					this.diagnostic("Unrecognised escape character.", this.getSourcePosition(-2));
				}
				break;
			default:
				value += this.current;
				break;
			}
			sourcePositions.push(this.getSourcePosition());
			this.next();
		}

		if (kind === SyntaxKind.StringToken) {
			this.diagnostic("Unterminated string literal.");
			return this.tokenWithValue(kind, value, this.getSourcePosition(), sourcePositions);
		} else {
			this.diagnostic("Unterminated character literal.");
			return this.tokenWithValue(kind, value, this.getSourcePosition());
		}
	}

	private lexNumber(): Token<SyntaxKind.IntegerToken | SyntaxKind.FloatToken> {
		const first = this.text.charCodeAt(this.textStart);
		let kind = SyntaxKind.IntegerToken;
		let charCode = this.charCode();

		let leadingZero: ReadonlyTextRange | undefined;
		if (first === CharCode.N0) {
			if (CharCode.isOctal(charCode)) {
				const value = this.lexOctal();
				return this.tokenWithValue(kind, value, this.getSourcePosition(-1));
			} else if (charCode === CharCode.x || charCode === CharCode.X) {
				const value = this.lexHexadecimal();
				return this.tokenWithValue(kind, value, this.getSourcePosition(-1));
			} else {
				leadingZero = {
					start: this.getSourcePosition(-2),
					end: this.getSourcePosition(-1)
				};
			}
		}

		const move = () => {
			this.next();
			charCode = this.charCode();
		};
		
		let trailingPart: number = -1;
		let floatStatus: FloatStatus = FloatStatus.None;

		while (!this.readEOF) {
			if (charCode === CharCode.DOT) {
				kind = SyntaxKind.FloatToken;
				if (floatStatus === FloatStatus.None) {
					floatStatus = FloatStatus.FoundDot;
				} else if (trailingPart < 0) {
					trailingPart = this.getSourcePosition(-1);
				}
				move();
				continue;
			}
			
			if (charCode === CharCode.e || charCode === CharCode.E) {
				kind = SyntaxKind.FloatToken;
				if (floatStatus !== FloatStatus.FoundE) {
					floatStatus = FloatStatus.FoundE;
				} else if (trailingPart < 0) {
					trailingPart = this.getSourcePosition(-1);
				}

				move();
				if (charCode === CharCode.MINUS || charCode === CharCode.PLUS) {
					move();
				}

				if (CharCode.isNumeric(charCode)) {
					move();
					continue;
				}

				if (charCode === CharCode.DOT || charCode === CharCode.e || charCode === CharCode.E) {
					// read the float number till the end
					while (!this.readEOF) {
						if (CharCode.isNumeric(charCode) || charCode === CharCode.DOT) {
							move();
							continue;
						}

						if (charCode !== CharCode.e && charCode !== CharCode.E) {
							break;
						}

						move();
						if (charCode === CharCode.MINUS || charCode === CharCode.PLUS) {
							move();
						}
					}
				}

				this.diagnostic("Exponent expected.", this.start);
				break;
			}
			
			if (!CharCode.isNumeric(charCode)) {
				break;
			}

			move();
		}
		
		const textEnd = this.cursor - 1;
		let value = this.text.slice(this.textStart, textEnd);
		const end = this.getSourcePosition(-1);

		if (leadingZero && textEnd - this.textStart > 1 &&
			                                     // 0. or 0e case
			(kind === SyntaxKind.IntegerToken || CharCode.isNumeric(value.charCodeAt(1)))
		) {
			this.diagnostic("Leading 0." +
				(kind === SyntaxKind.IntegerToken ? " Octal numbers use digits from 0 to 7 only." : ""),
				leadingZero.start, leadingZero.end, DiagnosticSeverity.Warning);
		}

		if (trailingPart >= 0) {
			this.diagnostic("Trailing part.", trailingPart, end, DiagnosticSeverity.Warning);
		}
		
		return this.tokenWithValue(kind, value, end);
	}

	private lexHexEscape(maxDigits: number): string {
		const textStart = this.cursor;
		this.next();
		const charCode = this.charCode();
		if (!CharCode.isHexadecimal(charCode)) {
			this.diagnostic("Hexadecimal number expected.");
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


	private lexOctal(): string {
		let charCode = this.charCode();
		let result = charCode - CharCode.N0;
		do {
			this.next();
			charCode = this.charCode();
			if (CharCode.isOctal(charCode)) {
				result = result * 8 + (charCode - CharCode.N0);
				continue;
			}

			if (CharCode.isNumeric(charCode)) {
				do {
					this.next();
					charCode = this.charCode();
				} while (CharCode.isNumeric(charCode) && !this.readEOF);

				this.diagnostic("Invalid octal number.", this.start);
			}
			break;

		} while (!this.readEOF);

		return result.toString();
	}

	private lexHexadecimal(): string {
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

					this.diagnostic("Invalid hexadecimal number.", this.start);
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

	private lexIdentifier(): Token<SyntaxKind.IdentifierToken | KeywordTokenKind> {
		while (!this.readEOF && CharCode.isAlphaNumeric(this.charCode())) {
			this.next();
		} 
		const textEnd = this.cursor - 1;
		const value = this.text.slice(this.textStart, textEnd);
		
		return this.tokenWithValue(ReservedKeywords.get(value) ?? SyntaxKind.IdentifierToken, value, this.getSourcePosition(-1));
	}

	public findTokenAtPosition(offset: number): { token: Token<SyntaxKind> | null, index: number, lexer: Lexer } {
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
				
				if (isTokenAString(token)) {
					const lexer = token.lexer;
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
	private tokens: Token<SyntaxKind>[];
	private index: number;

	constructor(tokens: Token<SyntaxKind>[], index = 0) {
		this.tokens = tokens;
		this.index = index;
	}

	public hasNext(): boolean {
		return this.index < this.tokens.length;
	}

	public next(): Token<SyntaxKind> {
		const token = this.tokens[this.index];
		this.index++;
		return token;
	}

	public hasPrevious(): boolean {
		return this.index > -1;
	}

	public previous(): Token<SyntaxKind> {
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
				return token.value!;
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
			//@ts-expect-error
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

			//@ts-expect-error
			for (const methods of globals.instancesMethods.values()) {
				const entry = methods.get(name);
				if (entry) {
					return entry;
				}
			}
			
			//@ts-expect-error
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