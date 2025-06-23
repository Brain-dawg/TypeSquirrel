import { Lexer, Token, TokenKind, tokenKindToString } from "./lexer";

export interface ASTNode {
	type: string;
	start: number;
	end: number;
}

export interface Statement extends ASTNode {}

export interface Expression extends ASTNode {}

export interface BlockStatement extends Statement {
	type: "BlockStatement";
	body: Statement[];
}

export interface ExpressionStatement extends Statement {
	type: "ExpressionStatement";
	expression: Expression;
}

export interface VariableDeclarationStatement extends Statement {
	type: "VariableDeclarationStatement";
	declarations: VariableDeclaration[];
}

export interface ConstantDeclarationStatement extends Statement {
	type: "ConstantDeclarationStatement";
	declaration: VariableDeclaration;
}

export interface VariableDeclaration extends ASTNode {
	type: "VariableDeclaration";
	name: string;
	initializer: Expression | null;
}

export interface IfStatement extends ASTNode {
    type: "IfStatement";
    condition: Expression;
    then: Statement;
    else: Statement | null;
}

export interface Identifier extends Expression {
    type: "Identifier";
    name: string;
}

export interface BinaryExpression extends Expression {
    type: "BinaryExpression";
    operator: string;
    left: Expression;
    right: Expression;
}

export interface ParserError {
	message: string,
	start: number,
	end: number
}

export class Parser {
	private readonly lexer: Lexer;

	private token: Token;
	private prevToken?: Token;
	
	private readonly errors: ParserError[];

	private readonly statementTokens: Map<TokenKind, Function> = new Map([
		[TokenKind.SEMICOLON, this.next.bind(this)],
		[TokenKind.IF, this.ifStatement.bind(this)],
		[TokenKind.WHILE, this.whileStatement.bind(this)],
		[TokenKind.DO, this.doWhileStatement.bind(this)],
		[TokenKind.FOR, this.forStatement.bind(this)],
		[TokenKind.FOREACH, this.foreachStatement.bind(this)],
		[TokenKind.LOCAL, this.localStatement.bind(this)],
		[TokenKind.CONST, this.constStatement.bind(this)],
		[TokenKind.RETURN, this.returnStatement.bind(this)],
		[TokenKind.YIELD, this.yieldStatement.bind(this)],
		[TokenKind.CONTINUE, this.continueStatement.bind(this)],
		[TokenKind.FUNCTION, this.functionStatement.bind(this)],
		[TokenKind.CLASS, this.classStatement.bind(this)],
		[TokenKind.ENUM, this.enumStatement.bind(this)],
		[TokenKind.TRY, this.tryCatchStatement.bind(this)],
		[TokenKind.THROW, this.throwStatement.bind(this)]
	]);


	constructor(lexer: Lexer) {
		this.lexer = lexer;

		this.token = lexer.lex();

		this.errors = [];
	}

	public getErrors(): ParserError[] {
		return this.errors;
	}

	private next(): TokenKind {
		this.token = this.lexer.lex();
		this.prevToken = this.lexer.getPreviousToken();
		return this.token.kind;
	}

	public parse(): void {
		this.next();
		while (this.token.kind !== TokenKind.EOF) {
			this.statement();
			if (this.prevToken!.kind !== TokenKind.RIGHT_CURLY && this.prevToken!.kind !== TokenKind.SEMICOLON) {
				this.optionalSemicolon();
			}
		} 
	}

	private statements() {
		while (this.token.kind !== TokenKind.RIGHT_CURLY && this.token.kind !== TokenKind.DEFAULT && this.token.kind !== TokenKind.CASE) {
			this.statement();
			if (this.prevToken!.kind !== TokenKind.RIGHT_CURLY && this.prevToken!.kind !== TokenKind.SEMICOLON) {
				this.optionalSemicolon();
			}
		}
	}

	private statement() {
		const func = this.statementTokens.get(this.token.kind);
		if (func) {
			func();
		} else {
			this.next();
		}
	}

	private expect(kind: TokenKind): string | null {
		if (this.token.kind !== kind) {
			this.errors.push({
				message: `Expected '${tokenKindToString.get(kind)}', but got '${tokenKindToString.get(this.token.kind)}'`,
				start: this.token.start,
				end: this.token.end
			});
			this.findNextStatement();
			return null;
		}
		const value = this.token.value;
		this.next();
		return value;
	}

	private expectScalar(): string | null {
		let value: string;
		switch (this.token.kind) {
		case TokenKind.INTEGER:
		case TokenKind.FLOAT:
		case TokenKind.STRING:
		case TokenKind.VERBATIM_STRING:
		case TokenKind.TRUE:
		case TokenKind.FALSE:
			value = this.token.value;
			break;
		case TokenKind.MINUS:
			const kind = this.next();
			if (kind !== TokenKind.INTEGER && kind !== TokenKind.FLOAT) {
				this.errors.push({
					message: "Scalar expected: integer or float",
					start: this.token.start,
					end: this.token.end
				});
				this.findNextStatement();
				return null;
			}
			value = this.token.value;
			break;
		default:
			this.errors.push({
				message: "Scalar expected: integer, float, boolean or string",
				start: this.token.start,
				end: this.token.end
			});
			this.findNextStatement();
			return null;
		}

		this.next();
		return value;
	}

	private localStatement(): void {
		this.next();
		if (this.token.kind === TokenKind.FUNCTION) {
			const variableName = this.expect(TokenKind.IDENTIFIER);
			if (!variableName) {
				return;
			}

			if (!this.expect(TokenKind.LEFT_ROUND)) {
				return;
			}

			return;
		}

		while (true) {
			const variableName = this.expect(TokenKind.IDENTIFIER);

			if (this.token.kind === TokenKind.ASSIGN) {
				this.next();
				this.expression();
			} else {

			}

			if (this.token.kind !== TokenKind.COMMA) {
				break;
			}

			this.next();
		} 
	}

	private constStatement(): void {
		this.next();
		const variableName = this.expect(TokenKind.IDENTIFIER);
		if (variableName === null) {
			return;
		}

		if (this.expect(TokenKind.ASSIGN) === null) {
			return;
		}

		const value = this.expectScalar();
		if (value === null) {
			return;
		}
	}

	private ifBlock(): void {
		if (this.token.kind === TokenKind.RIGHT_CURLY) {
			
		}
	}

	private ifStatement(): void {
		this.next();
		this.expect(TokenKind.LEFT_ROUND);
		this.commaExpression();
		this.expect(TokenKind.RIGHT_ROUND);
	}

	private whileStatement(): void {
		this.next();
	}

	private doWhileStatement(): void {
		this.next();
	}

	private forStatement(): void {
		this.next();
	}

	private foreachStatement(): void {
		this.next();
	}

	private switchStatement(): void {
		this.next();
	}

	private returnStatement(): void {
		this.next();
	}
	private yieldStatement(): void {
		this.next();
	}
	private continueStatement(): void {
		this.next();
	}
	private functionStatement(): void {
		this.next();
	}
	private classStatement(): void {
		this.next();
	}
	private enumStatement(): void {
		this.next();
	}
	private tryCatchStatement(): void {
		this.next();
	}
	private throwStatement(): void {
		this.next();
	}

	private findNextStatement(): void {
		while (this.token.kind !== TokenKind.EOF) {
			this.next();
			if (this.statementTokens.has(this.token.kind)) {
				return;
			}
		}
	}

	private isEndOfStatement(): boolean {
		return this.prevToken!.kind === TokenKind.LINE_FEED ||
			this.token.kind === TokenKind.EOF ||
			this.token.kind === TokenKind.RIGHT_CURLY ||
			this.token.kind === TokenKind.SEMICOLON;
	}

	private optionalSemicolon(): void {
		if (this.token.kind === TokenKind.SEMICOLON) {
			this.next();
			return;
		}

		if (!this.isEndOfStatement()) {
			this.errors.push({
				message: "End of statement expected (; or line feed)",
				start: this.token.end,
				end: this.token.end
			});
		}
	}

	private expression(): void {
		this.logicalOrExpression();
	}

	private logicalOrExpression(): void  {
		this.logicalAndExpression();
		while (this.token.kind === TokenKind.OR) {
			const operator = this.token.value;
			this.next();
			this.logicalAndExpression();
		}
	}

	private logicalAndExpression(): void  {
		this.bitwiseOrExpression();
		while (this.token.kind === TokenKind.AND) {
			const operator = this.token.value;
			this.next();
			this.bitwiseOrExpression();
		}
	}

	private bitwiseOrExpression(): void  {
		this.bitwiseXorExpression();
		while (this.token.kind === TokenKind.BIT_OR) {
			const operator = this.token.value;
			this.next();
			this.bitwiseXorExpression();
		}
	}

	private bitwiseXorExpression(): void  {
		this.bitwiseAndExpression();
		while (this.token.kind === TokenKind.BIT_XOR) {
			const operator = this.token.value;
			this.next();
			this.bitwiseAndExpression();
		}
	}

	private bitwiseAndExpression(): void  {
		this.equalityExpression();
		while (this.token.kind === TokenKind.BIT_AND) {
			const operator = this.token.value;
			this.next();
			this.equalityExpression();
		}
	}

	private equalityExpression(): void {
		this.relationalExpression();
		while (this.token.kind === TokenKind.EQUALS || this.token.kind === TokenKind.NOT_EQUALS) {
			const operator = this.token.value;
			this.next();
			this.relationalExpression();
		}
	}

	private relationalExpression(): void {
		this.shiftExpression();
		while (this.token.kind === TokenKind.LESS || 
			   this.token.kind === TokenKind.GREATER || 
			   this.token.kind === TokenKind.LESS_EQUALS || 
			   this.token.kind === TokenKind.GREATER_EQUALS ||
			   this.token.kind === TokenKind.THREE_WAY_CMP) {
			const operator = this.token.value;
			this.next();
			this.shiftExpression();
		}
	}

	private shiftExpression(): void {
		this.additiveExpression();
		while (this.token.kind === TokenKind.SHIFT_LEFT || 
			   this.token.kind === TokenKind.SHIFT_RIGHT || 
			   this.token.kind === TokenKind.UNSIGNED_SHIFT_RIGHT) {
			const operator = this.token.value;
			this.next();
			this.additiveExpression();
		}
	}

	private additiveExpression(): void {
		this.multiplicationExpression();
		while (this.token.kind === TokenKind.PLUS || this.token.kind === TokenKind.MINUS) {
			const operator = this.token.value;
			this.next();
			this.multiplicationExpression();
		}
	}

	private multiplicationExpression(): void {
		this.prefixedExpression();
		while (this.token.kind === TokenKind.MULTIPLY || 
			   this.token.kind === TokenKind.DIVIDE || 
			   this.token.kind === TokenKind.MODULO) {
			const operator = this.token.value;
			this.next();
			this.prefixedExpression();
		}
	}

	private prefixedExpression(): void {
		
	}

	
	private commaExpression(): void {
		for (this.expression(); this.token.kind === TokenKind.COMMA; this.next(), this.commaExpression()) { }
	}
}