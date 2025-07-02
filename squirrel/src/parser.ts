import { Token, SyntaxKind, tokenKindToString, Error, Expression, BinaryExpression, StringLiteral, NumericLiteral, BooleanLiteral, NullLiteral, IdentifierExpression, ConstDeclarationStatement, ScalarLiteral, LocalDeclarationStatement, LocalDeclaration, BlockStatement, Statement, CommaExpression } from "./squirrel";
import { Lexer } from "./lexer";

export class Parser {
	private readonly lexer: Lexer;

	private currentToken: Token;
	private prevToken?: Token;

	private readonly errors: Error[];

	constructor(lexer: Lexer) {
		this.lexer = lexer;

		this.currentToken = lexer.lex();

		this.errors = [];
	}

	public getErrors(): Error[] {
		return this.errors;
	}

	private next(): SyntaxKind {
		this.currentToken = this.lexer.lex();
		this.prevToken = this.lexer.getPreviousToken();
		return this.currentToken.kind;
	}

	private token(): Token {
		return this.currentToken;
	}

	public parse(): BlockStatement {
		const statements: Statement[] = [];
		while (this.token().kind !== SyntaxKind.EOF) {
			const statement = this.statement();
			if (statement) {	
				statements.push(statement);
			}
			if (this.prevToken!.kind !== SyntaxKind.CloseCurlyToken && this.prevToken!.kind !== SyntaxKind.SemicolonToken) {
				this.optionalSemicolon();
			}
		}
		return {
			kind: SyntaxKind.BlockStatement,
			start: 0,
			end: this.token().end,
			body: statements
		};
	}

	private statements(): BlockStatement {
		const statements: Statement[] = [];
		while (this.token().kind !== SyntaxKind.CloseCurlyToken && this.token().kind !== SyntaxKind.DefaultKeyword && this.token().kind !== SyntaxKind.CaseKeyword) {
			const statement = this.statement();
			if (statement) {
				statements.push(statement);
			}
			if (this.prevToken!.kind !== SyntaxKind.CloseCurlyToken && this.prevToken!.kind !== SyntaxKind.SemicolonToken) {
				this.optionalSemicolon();
			}
		}

		return {
			kind: SyntaxKind.BlockStatement,
			start: statements[0].start,
			end: statements[statements.length - 1].end,
			body: statements
		};
	}

	private statement(): Statement | undefined {
		switch (this.token().kind) {
		case SyntaxKind.SemicolonToken: this.next(); return;
		case SyntaxKind.IfKeyword: return this.ifStatement();
		case SyntaxKind.WhileKeyword: return this.whileStatement();
		case SyntaxKind.DoKeyword: return this.doWhileStatement();
		case SyntaxKind.ForKeyword: return this.forStatement();
		case SyntaxKind.ForeachKeyword: return this.foreachStatement();
		case SyntaxKind.SwitchKeyword: return this.switchStatement();
		case SyntaxKind.LocalKeyword: return this.localStatement();
		case SyntaxKind.ConstKeyword: return this.constStatement();
		case SyntaxKind.ReturnKeyword: return this.returnStatement();
		case SyntaxKind.YieldKeyword: return this.yieldStatement();
		case SyntaxKind.FunctionKeyword: return this.functionStatement();
		case SyntaxKind.ClassKeyword: return this.classStatement();
		case SyntaxKind.EnumKeyword: return this.enumStatement();
		case SyntaxKind.OpenCurlyToken: {
			this.next();
			const statements = this.statements();
			this.expect(SyntaxKind.CloseCurlyToken);
			return statements;
		}
		case SyntaxKind.TryKeyword: return this.tryCatchStatement();
		case SyntaxKind.ThrowKeyword: {
			this.next();
			const expression = this.commaExpression();
			return expression;
		}
		default: 
		}
	}

	private expect(kind: SyntaxKind): Token | null {
		const token = this.token();
		if (token.kind !== kind) {
			this.errors.push({
				message: `Expected '${tokenKindToString.get(kind)}', but got '${tokenKindToString.get(this.token().kind)}'`,
				start: this.token().start,
				end: this.token().end
			});
			this.findNextStatement();
			return null;
		}
		this.next();
		return token;
	}

	private expectScalar(): ScalarLiteral | null {
		switch (this.token().kind) {
		case SyntaxKind.StringToken:
		case SyntaxKind.VerbatimStringToken: {
			const expr: StringLiteral = {
				kind: SyntaxKind.StringLiteral,
				start: this.token().start,
				end: this.token().end,
				value: this.token().value,
				isVerbatim: this.token().kind === SyntaxKind.StringToken
			};
			this.next();
			return expr;
		}
		case SyntaxKind.IntegerToken:
		case SyntaxKind.FloatToken: {
			const expr: NumericLiteral = {
				kind: SyntaxKind.NumericLiteral,
				start: this.token().start,
				end: this.token().end,
				value: 0
			};
			this.next();
			return expr;
		}
		case SyntaxKind.TrueKeyword:
		case SyntaxKind.FalseKeyword: {
			const expr: BooleanLiteral = {
				kind: SyntaxKind.BooleanLiteral,
				start: this.token().start,
				end: this.token().end,
				value: this.token().kind === SyntaxKind.TrueKeyword
			};

			this.next();
			return expr;
		}
		case SyntaxKind.MinusToken:
			const kind = this.next();
			if (kind !== SyntaxKind.IntegerToken && kind !== SyntaxKind.FloatToken) {
				this.errors.push({
					message: "Scalar expected: integer or float",
					start: this.token().start,
					end: this.token().end
				});
				this.findNextStatement();
				return null;
			}
			const expr: NumericLiteral = {
				kind: SyntaxKind.NumericLiteral,
				start: this.token().start,
				end: this.token().end,
				value: 0
			};
			this.next();
			return expr;
		default:
			this.errors.push({
				message: "Scalar expected: integer, float, boolean or string",
				start: this.token().start,
				end: this.token().end
			});
			this.findNextStatement();
			return null;
		}
	}

	private localStatement(): LocalDeclarationStatement | undefined {
		const start = this.token().start;
		this.next();
		if (this.token().kind === SyntaxKind.FunctionKeyword) {
			const name = this.expect(SyntaxKind.IdentifierToken);
			if (!name) {
				return undefined;
			}

			if (!this.expect(SyntaxKind.OpenRoundToken)) {
				return undefined;
			}

			return;
		}

		const declarationList: LocalDeclaration[] = [];
		while (true) {
			const name = this.expect(SyntaxKind.IdentifierToken);
			if (!name) {
				return;
			}

			if (this.token().kind === SyntaxKind.EqualsToken) {
				this.next();
				const initialiser = this.expression();
				declarationList.push({
					kind: SyntaxKind.LocalDeclaration,
					start: name.start,
					end: initialiser.end,
					name: name.value,
					initialiser
				});
			} else {
				declarationList.push({
					kind: SyntaxKind.LocalDeclaration,
					start: name.start,
					end: name.end,
					name: name.value
				});
			}

			if (this.token().kind !== SyntaxKind.CommaToken) {
				break;
			}

			this.next();
		}
		if (declarationList.length === 0) {
			return undefined;
		}

		return {
			kind: SyntaxKind.LocalDeclarationStatement,
			start: start,
			end: declarationList[declarationList.length - 1].end,
			declarations: declarationList
		};
	}

	private constStatement(): ConstDeclarationStatement | undefined {
		const start = this.token().start;
		this.next();
		const name = this.expect(SyntaxKind.IdentifierToken);
		if (name === null) {
			return undefined;
		}

		if (this.expect(SyntaxKind.EqualsToken) === null) {
			return undefined;
		}

		const initialiser = this.expectScalar();
		if (initialiser === null) {
			return undefined;
		}

		return {
			kind: SyntaxKind.ConstDeclarationStatement,
			start: start,
			end: this.token().end,
			name: name.value,
			initialiser
		};
	}


	private ifStatement(): Statement | undefined {
		this.next();
		this.expect(SyntaxKind.OpenRoundToken);
		this.commaExpression();
		this.expect(SyntaxKind.CloseRoundToken);
		return undefined;
	}

	private whileStatement(): Statement | undefined {
		this.next();

		return undefined;
	}

	private doWhileStatement(): Statement | undefined {
		this.next();
		return undefined;
	}

	private forStatement(): Statement | undefined {
		this.next();
		return undefined;
	}

	private foreachStatement(): Statement | undefined {
		this.next();
		return undefined;
	}

	private switchStatement(): Statement | undefined {
		this.next();
		return undefined;
	}

	private returnStatement(): Statement | undefined {
		this.next();
		return undefined;
	}
	private yieldStatement(): Statement | undefined {
		this.next();
		return undefined;
	}
	private continueStatement(): Statement | undefined {
		this.next();
		return undefined;
	}
	private functionStatement(): Statement | undefined {
		this.next();
		return undefined;
	}
	private classStatement(): Statement | undefined {
		this.next();
		return undefined;
	}
	private enumStatement(): Statement | undefined {
		this.next();
		return undefined;
	}
	private tryCatchStatement(): Statement | undefined {
		this.next();
		return undefined;
	}
	private throwStatement(): Statement | undefined {
		this.next();
		return undefined;
	}

	private findNextStatement(): void {
		return;
	}

	private isEndOfStatement(): boolean {
		return this.prevToken!.kind === SyntaxKind.LineFeedToken ||
			this.token().kind === SyntaxKind.EOF ||
			this.token().kind === SyntaxKind.CloseCurlyToken ||
			this.token().kind === SyntaxKind.SemicolonToken;
	}

	private optionalSemicolon(): void {
		if (this.token().kind === SyntaxKind.SemicolonToken) {
			this.next();
			return;
		}

		if (!this.isEndOfStatement()) {
			this.errors.push({
				message: "End of statement expected (; or line feed)",
				start: this.token().end,
				end: this.token().end
			});
		}
	}

	private expression(): Expression {
		return this.logicalOrExpression();
	}

	private logicalOrExpression(): Expression {
		let left = this.logicalAndExpression();
		while (this.token().kind === SyntaxKind.PipePipeToken) {
			const operator = this.token().value;
			this.next();
			const right = this.logicalAndExpression();
			const expr = { kind: SyntaxKind.BinaryExpression, start: left.start, end: right.end, left, right, operator };
			left.parent = expr;
			right.parent = expr;
			left = expr;
		}
		return left;
	}

	private logicalAndExpression(): Expression {
		let left = this.bitwiseOrExpression();
		while (this.token().kind === SyntaxKind.AmpersandAmpersandToken) {
			const operator = this.token().value;
			this.next();
			const right = this.bitwiseOrExpression();
			const expr = { kind: SyntaxKind.BinaryExpression, start: left.start, end: right.end, left, right, operator };
			left.parent = expr;
			right.parent = expr;
			left = expr;
		}
		return left;
	}

	private bitwiseOrExpression(): Expression {
		let left = this.bitwiseXorExpression();
		while (this.token().kind === SyntaxKind.PipeToken) {
			const operator = this.token().value;
			this.next();
			const right = this.bitwiseXorExpression();
			const expr = { kind: SyntaxKind.BinaryExpression, start: left.start, end: right.end, left, right, operator };
			left.parent = expr;
			right.parent = expr;
			left = expr;
		}
		return left;
	}

	private bitwiseXorExpression(): Expression {
		let left = this.bitwiseAndExpression();
		while (this.token().kind === SyntaxKind.CaretToken) {
			const operator = this.token().value;
			this.next();
			const right = this.bitwiseAndExpression();
			const expr = { kind: SyntaxKind.BinaryExpression, start: left.start, end: right.end, left, right, operator };
			left.parent = expr;
			right.parent = expr;
			left = expr;
		}
		return left;
	}

	private bitwiseAndExpression(): Expression {
		let left = this.equalityExpression();
		while (this.token().kind === SyntaxKind.AmpersandToken) {
			const operator = this.token().value;
			this.next();
			const right = this.equalityExpression();
			const expr = { kind: SyntaxKind.BinaryExpression, start: left.start, end: right.end, left, right, operator };
			left.parent = expr;
			right.parent = expr;
			left = expr;
		}
		return left;
	}

	private equalityExpression(): Expression {
		let left = this.relationalExpression();
		while (this.token().kind === SyntaxKind.EqualsEqualsToken || this.token().kind === SyntaxKind.NotEqualsToken) {
			const operator = this.token().value;
			this.next();
			const right = this.relationalExpression();
			const expr = { kind: SyntaxKind.BinaryExpression, start: left.start, end: right.end, left, right, operator };
			left.parent = expr;
			right.parent = expr;
			left = expr;
		}
		return left;
	}

	private relationalExpression(): Expression {
		let left = this.shiftExpression();
		while (this.token().kind === SyntaxKind.LessThanToken || this.token().kind === SyntaxKind.GreaterThanToken || this.token().kind === SyntaxKind.LessThanEqualsToken || this.token().kind === SyntaxKind.GreaterThanEqualsToken || this.token().kind === SyntaxKind.LessThanEqualsGreaterThanToken) {
			const operator = this.token().value;
			this.next();
			const right = this.shiftExpression();
			const expr = { kind: SyntaxKind.BinaryExpression, start: left.start, end: right.end, left, right, operator };
			left.parent = expr;
			right.parent = expr;
			left = expr;
		}
		return left;
	}

	private shiftExpression(): Expression {
		let left = this.additiveExpression();
		while (this.token().kind === SyntaxKind.LessThanLessThanToken || this.token().kind === SyntaxKind.GreaterThanGreaterThanToken || this.token().kind === SyntaxKind.GreaterThanGreaterThanGreaterThanToken) {
			const operator = this.token().value;
			this.next();
			const right = this.additiveExpression();
			const expr = { kind: SyntaxKind.BinaryExpression, start: left.start, end: right.end, left, right, operator };
			left.parent = expr;
			right.parent = expr;
			left = expr;
		}
		return left;
	}

	private additiveExpression(): Expression {
		let left = this.multiplicationExpression();
		while (this.token().kind === SyntaxKind.PlusToken || this.token().kind === SyntaxKind.MinusToken) {
			const operator = this.token().value;
			this.next();
			const right = this.multiplicationExpression();
			const expr = { kind: SyntaxKind.BinaryExpression, start: left.start, end: right.end, left, right, operator };
			left.parent = expr;
			right.parent = expr;
			left = expr;
		}
		return left;
	}

	private multiplicationExpression(): Expression {
		let left = this.postfixedExpression();
		while (this.token().kind === SyntaxKind.AsteriskToken || this.token().kind === SyntaxKind.SlashToken || this.token().kind === SyntaxKind.PercentToken) {
			const operator = this.token().value;
			this.next();
			const right = this.postfixedExpression();
			const expr = { kind: SyntaxKind.BinaryExpression, start: left.start, end: right.end, left, right, operator };
			left.parent = expr;
			right.parent = expr;
			left = expr;
		}
		return left;
	}

	private postfixedExpression(): Expression {
		let expr = this.primaryExpression();

		return expr;
	}

	private primaryExpression(): Expression {
		switch (this.token().kind) {
		case SyntaxKind.StringToken:
		case SyntaxKind.VerbatimStringToken: {
			const expr: StringLiteral = {
				kind: SyntaxKind.StringLiteral,
				start: this.token().start,
				end: this.token().end,
				value: this.token().value,
				isVerbatim: this.token().kind === SyntaxKind.StringToken
			};
			this.next();
			return expr;
		}
		case SyntaxKind.IntegerToken:
		case SyntaxKind.FloatToken: {
			const expr: NumericLiteral = {
				kind: SyntaxKind.NumericLiteral,
				start: this.token().start,
				end: this.token().end,
				value: 0
			};
			this.next();
			return expr;
		}
		case SyntaxKind.TrueKeyword:
		case SyntaxKind.FalseKeyword: {
			const expr: BooleanLiteral = {
				kind: SyntaxKind.BooleanLiteral,
				start: this.token().start,
				end: this.token().end,
				value: this.token().kind === SyntaxKind.TrueKeyword
			};

			this.next();
			return expr;
		}
		case SyntaxKind.NullKeyword: {
			// Return a literal expression node
			const expr = {
				kind: SyntaxKind.NullLiteral,
				start: this.token().start,
				end: this.token().end,
				value: null
			};
			this.next();
			return expr;
		}
		case SyntaxKind.IdentifierToken: {
			const expr = {
				kind: SyntaxKind.IdentifierExpression,
				start: this.token().start,
				end: this.token().end,
				value: this.token().value
			};
			this.next();
			return expr;
		}
		default:
			this.errors.push({
				start: this.token().start,
				end: this.token().end,
				message: "Expression Expected"
			});
		}
		return {
			kind: SyntaxKind.Invalid,
			start: this.token().start,
			end: this.token().end
		};
	}


	private commaExpression(): CommaExpression | undefined {
		const expressions: Expression[] = [];
		while (true) {
			const expression = this.expression();
			expressions.push(expression);
			if (this.token().kind !== SyntaxKind.CommaToken) {
				break;
			}
			this.next();
		}
		if (expressions.length === 0) {
			return undefined;
		}
		return {
			kind: SyntaxKind.CommaExpression,
			start: expressions[0].start,
			end: expressions[expressions.length - 1].end,
			body: expressions
		};
	}
}