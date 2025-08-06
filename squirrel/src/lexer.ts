import CharCode from './charCode';
import * as globals from './globals';
import { Doc, Token, VScriptDiagnostic, SyntaxKind, isTokenAComment, StringToken, ReservedKeywords, isTokenAString, DiagnosticSeverity, ReadonlyTextRange, ValuedToken, Keyword, } from './types';

type TokenFunction = () => Token<ValuedToken>;

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

	private previousToken?: Token<SyntaxKind>;
	private currentToken?: Token<SyntaxKind>;

	private start: number;
	private textStart: number;

	private readonly tokens: Token<SyntaxKind>[];

	private readonly sourcePositions: number[];
	private readonly diagnostics: VScriptDiagnostic[];

	private readonly tokenMap: TokenMap = {
		'\r': SyntaxKind.Trivia,
		' ': SyntaxKind.Trivia,
		'\t': SyntaxKind.Trivia,
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
				fallback: SyntaxKind.Invalid,
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

		fallback: SyntaxKind.Invalid
	};

	constructor(text: string, sourcePositions?: number[]) {
		this.text = text;

		this.cursor = 0;
		this.current = '';
		this.readEOF = false;

		this.start = 0;
		this.textStart = 0;

		this.tokens = [];

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

	public getPreviousToken(): Token<SyntaxKind> | undefined {
		return this.previousToken;
	}

	private diagnostic(message: string, start?: number, end?: number, severity: DiagnosticSeverity = DiagnosticSeverity.Error): VScriptDiagnostic | undefined {
		if (start === undefined) {
			start = this.getSourcePosition(-1);
			end = this.getSourcePosition(0);
		} else if (end === undefined) {
			end = this.getSourcePosition(0);
		}
		
		let result: VScriptDiagnostic | undefined;
		const length = this.diagnostics.length;
		if (length === 0 || this.diagnostics[length - 1].start !== start) {
			result = {
				start,
				end,
				message,
				severity
			};
			this.diagnostics.push(result);
		}
		return result;
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

	private updateTokens(token: Token<SyntaxKind>): void {
		this.tokens.push(token);
		this.previousToken = this.currentToken;
		this.currentToken = token;
	}

	public getTokens(): Token<SyntaxKind>[] {
		return this.tokens;
	}

	public lex(): Token<SyntaxKind> {
		let previousEntry: TokenMap | undefined;

		while (true) {
			let entry: TokenMap | SyntaxKind | TokenFunction;
			if (!previousEntry) {
				if (this.readEOF) {
					const position = this.getSourcePosition();
					const token: Token<SyntaxKind.EndOfFileToken> = {
						kind: SyntaxKind.EndOfFileToken,
						start: position,
						end: position
					} as Token<SyntaxKind.EndOfFileToken>;
					this.updateTokens(token);
					return token;
				}

				this.start = this.getSourcePosition(-1);
				this.textStart = this.cursor - 1;

				entry = this.advanceOrFallback(this.tokenMap);
				
				switch (entry) {
				case SyntaxKind.Invalid:
					this.diagnostic("Invalid token.", this.start);
					this.next();
					continue;
				case SyntaxKind.Trivia:
					continue;
				case SyntaxKind.LineFeedToken:
					this.currentToken = this.simpleToken(entry);
					continue;
				}
			} else if (this.readEOF) {
				entry = previousEntry.fallback;
			} else {
				entry = this.advanceOrFallback(previousEntry);
			}
			
			if (typeof entry === "number") {
				if (entry === SyntaxKind.Invalid) {
					this.diagnostic("Invalid token.", this.start, this.getSourcePosition(-1));
					previousEntry = undefined;
					continue;
				}

				const token = this.simpleToken(entry);
				this.updateTokens(token);
				return token;
			}

			if (typeof entry === "function") {
				const token = entry();
				if (isTokenAComment(token)) {
					previousEntry = undefined;
					continue;
				}

				this.updateTokens(token);
				return token;
			}

			previousEntry = entry;
		}
	}
	
	private simpleToken<T extends SyntaxKind>(kind: T): Token<T> {
		const end = this.getSourcePosition(-1);
		return {
			kind,
			start: this.start,
			end
		} as Token<T>;
	}

	private textSliceToken<T extends ValuedToken>(kind: T): Token<T> {
		const end = this.getSourcePosition(-1);
		const textEnd = this.cursor - 1;
		return {
			kind,
			start: this.start,
			end,
			value: this.text.slice(this.textStart, textEnd)
		} as Token<T>;
	}

	private lexBlockComment(): Token<SyntaxKind.BlockComment | SyntaxKind.DocComment> {
		let kind = SyntaxKind.BlockComment;
		this.next();
		if (this.charCode() === CharCode.ASTERISK) {
			this.next();
			// /**/
			if (this.charCode() === CharCode.SLASH) {
				this.next();

				return this.textSliceToken(kind);
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

				return this.textSliceToken(kind);
			}
			this.next();
		}
		this.diagnostic("'*/' expected.", this.getSourcePosition());
		return this.textSliceToken(kind);
	}

	private lexLineComment(): Token<SyntaxKind.LineComment> {
		while (!this.readEOF && this.charCode() !== CharCode.LINE_FEED) {
			this.next();
		}

		return this.textSliceToken(SyntaxKind.LineComment);
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
					return {
						kind,
						start: this.start,
						end: this.getSourcePosition(),
						value,
						sourcePositions
					};
				}
			}

			value += charCode === CharCode.BACKTICK ? '"' : this.current;
			sourcePositions.push(this.getSourcePosition());
			this.next();
		}

		this.diagnostic("Unterminated string literal.");

		return {
			kind,
			start: this.start,
			end: this.getSourcePosition(),
			value,
			sourcePositions
		};
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
					return { kind, value, start: this.start, end, sourcePositions };
				}

				if (value.length === 0) {
					this.diagnostic("Hexadecimal number expected.", this.start);
					this.next();
					return { kind, value: '0', start: this.start, end };
				}

				if (value.length > 1) {
					this.diagnostic("Character literal can only contain a single character.", this.start);
				}

				this.next();
				return { kind, value: value.charCodeAt(0).toString(), start: this.start, end };
			case CharCode.LINE_FEED:
				this.diagnostic(`Unterminated ${kind === SyntaxKind.StringToken ? "string" : "character"} literal.`);
				return { kind, value, start: this.start, end: this.getSourcePosition(-2), sourcePositions };
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

		this.diagnostic(`Unterminated ${kind === SyntaxKind.StringToken ? "string" : "character"} literal.`);
		return { kind, value, start: this.start, end: this.getSourcePosition(), sourcePositions };
	}

	private lexNumber(): Token<SyntaxKind.IntegerToken | SyntaxKind.FloatToken> {
		const first = this.text.charCodeAt(this.textStart);
		let kind = SyntaxKind.IntegerToken;
		let charCode = this.charCode();

		let leadingZero: ReadonlyTextRange | undefined;
		if (first === CharCode.N0) {
			if (CharCode.isOctal(charCode)) {
				const value = this.lexOctal();
				const end = this.getSourcePosition(-1);
				return { kind, value, start: this.start, end };
			} else if (charCode === CharCode.x || charCode === CharCode.X) {
				const value = this.lexHexadecimal();
				const end = this.getSourcePosition(-1);
				return { kind, value, start: this.start, end };
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
		
		return { kind, value, start: this.start, end };
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

	private lexIdentifier(): Token<SyntaxKind.IdentifierToken | Keyword> {
		while (!this.readEOF && CharCode.isAlphaNumeric(this.charCode())) {
			this.next();
		} 
		const textEnd = this.cursor - 1;
		const value = this.text.slice(this.textStart, textEnd);
		
		const end = this.getSourcePosition(-1);
		return {
			kind: ReservedKeywords.get(value) ?? SyntaxKind.IdentifierToken,
			value,
			start: this.start,
			end
		};
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