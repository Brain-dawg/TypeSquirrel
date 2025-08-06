import { Lexer } from "./lexer";
import { Block, DiagnosticSeverity, DoStatement, EmptyStatement, Expression, ForEachStatement, ForStatement, getBinaryOperatorPrecedence, Identifier, IfStatement, isTokenAKeyword, isTokenAValidIdentifier, LocalStatement, MissingToken, Node, NodeArray, OperatorPrecedence, PrimaryExpression, Statement, SyntaxKind, Token, TokenNode, TokenToString, VScriptDiagnostic, WhileStatement } from "./types";
import { createBinaryExpression, createBlockStatement, createConditionalExpression, createDoStatement, createEmptyStatement, createForEachStatement, createForStatement, createIdentifier, createIfStatement, createMissingNode, createNodeArray, createNodeFromToken, createTokenNode, createWhileStatement, isNodeMissing } from "./nodeFunctions";


const enum ParsingContext {
	SourceElements         = 1 << 0,  // Elements in source file
	BlockStatements        = 1 << 1,  // Statements in block
	SwitchClauseStatements = 1 << 3,  // Statements in switch clause
	SwitchClauses          = 1 << 2,  // Clauses in switch statement
	ClassMembers           = 1 << 4,  // Members in class declaration
	EnumMembers            = 1 << 5,  // Members in enum declaration
	TableLiteralMembers    = 1 << 6,  // Members in object literal
	ArrayLiteralMembers    = 1 << 7,  // Members in array literal
	VariableDeclarations   = 1 << 8,  // Variable declarations in local statement
	Parameters             = 1 << 9,  // Parameters in parameter list
	ArgumentExpressions    = 1 << 10, // Function call arguments, pretty much the same as array literal
	Count                             // +1 than the last entry, used for loop iteration
}

export class Parser {
	private readonly lexer: Lexer;

	private parsingContext: number;

	private currentToken: Token<SyntaxKind>;
	private hasPrecedingLineBreak: boolean;

	private readonly diagnostics: VScriptDiagnostic[];

	constructor(lexer: Lexer) {
		this.lexer = lexer;

		this.parsingContext = 0.0;

		this.currentToken = lexer.lex();
		this.hasPrecedingLineBreak = false;

		this.diagnostics = [];
	}

	private diagnosticAtCurrentToken(message: string, severity: DiagnosticSeverity = DiagnosticSeverity.Error): VScriptDiagnostic | undefined {
		return this.diagnostic(message, this.token().start, this.token().end, severity);
	}

	private diagnostic(message: string, start: number, end: number, severity: DiagnosticSeverity = DiagnosticSeverity.Error): VScriptDiagnostic | undefined {
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

	public getDiagnostics(): VScriptDiagnostic[] {
		return this.diagnostics;
	}

	private next(): SyntaxKind {
		this.currentToken = this.lexer.lex();
		this.hasPrecedingLineBreak = this.lexer.getPreviousToken()!.kind === SyntaxKind.LineFeedToken;
		return this.currentToken.kind;
	}

	private token(): Token<SyntaxKind> {
		return this.currentToken;
	}

	private parseTokenNode<T extends Node>(): T {
		return createNodeFromToken(this.token()) as T;
	}

	private parseOptional(kind: SyntaxKind): boolean {
		if (this.token().kind === kind) {
			this.next();
			return true;
		}

		return false;
	}

	private parseOptionalAndReturn<T extends SyntaxKind>(kind: T): TokenNode<T> | undefined {
		const token = this.token();
		if (token.kind !== kind) {
			return;
		}

		this.next();
		return createNodeFromToken<T>(token as Token<T>);
	}

	private parseExpected(kind: SyntaxKind, additionalMessage: string = ""): boolean {
		if (this.parseOptional(kind)) {
			return true;
		}

		this.diagnosticAtCurrentToken("Expected " + additionalMessage + `'${TokenToString.get(kind)}'.`);
		return false;
	}

	private parseExpectedAndReturn<T extends SyntaxKind>(kind: T, additionalMessage: string = ""): TokenNode<T> {
		const result = this.parseOptionalAndReturn(kind);
		if (result) {
			return result;
		}

		this.diagnosticAtCurrentToken("Expected " + additionalMessage + `'${TokenToString.get(kind)}'.`);
		return createMissingNode(this.token().start, kind);
	}

	// Used to get the end of the statement
	// e.g. `do {...} while (expr)` the ) is the end of `do` statement
	private parseEndToken(kind: SyntaxKind): number {
		const token = this.token();
		if (token.kind === kind) {
			this.next();
			return token.end;
		}

		this.diagnosticAtCurrentToken(`Expected '${TokenToString.get(kind)}'.`);
		return token.start;
	}

	private canParseSemicolon(): boolean {
		const kind = this.token().kind;

		return kind === SyntaxKind.SemicolonToken || kind === SyntaxKind.CloseBraceToken ||
			kind === SyntaxKind.EndOfFileToken || this.hasPrecedingLineBreak;
    }

	private parseList<T extends Node>(context: ParsingContext, parseElement: () => T): NodeArray<T> {
		const saveParsingContext = this.parsingContext;
		this.parsingContext |= context;
		const list: T[] = [];
		const start = this.token().start;

		while (!this.isListTerminator(context)) {
			if (this.isListElement(context)) {
				const element = parseElement();
				list.push(element);
			}

			if (this.abortParsingListOrMoveToNextToken(context)) {
				break;
			}
		}

		this.parsingContext = saveParsingContext;
		return createNodeArray(start, list);
	}

	private isListTerminator(parsingContext: ParsingContext) {
		const kind = this.token().kind;
		if (kind === SyntaxKind.EndOfFileToken) {
			// Being at the end of the file ends all lists.
			return true;
		}

		switch (parsingContext) {
		case ParsingContext.SourceElements:
		case ParsingContext.BlockStatements:
		case ParsingContext.SwitchClauses:
		case ParsingContext.ClassMembers:
		case ParsingContext.EnumMembers:
		case ParsingContext.TableLiteralMembers:
			return kind === SyntaxKind.CloseBraceToken;
		case ParsingContext.SwitchClauseStatements:
			return kind === SyntaxKind.CloseBraceToken || kind === SyntaxKind.CaseKeyword || kind === SyntaxKind.DefaultKeyword;
		case ParsingContext.ArrayLiteralMembers:
			return kind === SyntaxKind.CloseBracketToken;
		case ParsingContext.VariableDeclarations:
			return this.canParseSemicolon();
		case ParsingContext.Parameters:
		case ParsingContext.ArgumentExpressions:
			return kind === SyntaxKind.CloseParenthesisToken;
		}
	}

	private isListElement(context: ParsingContext, inErrorRecovery: boolean = false) {
		const kind = this.token().kind;
		switch (context) {
		case ParsingContext.SourceElements:
		case ParsingContext.BlockStatements:
		case ParsingContext.SwitchClauseStatements:
			// If we're in error recovery, then we don't want to treat ';' as an empty statement.
			// The problem is that ';' can show up in far too many contexts, and if we see one
			// and assume it's a statement, then we may bail out inappropriately from whatever
			// we're parsing.  For example, if we have a semicolon in the middle of a class, then
			// we really don't want to assume the class is over and we're on a statement in the
			// outer module.  We just want to consume and move on.
			return !(inErrorRecovery && kind === SyntaxKind.SemicolonToken) && this.isStartOfStatement();
		case ParsingContext.SwitchClauses:
			return kind === SyntaxKind.CaseKeyword || kind === SyntaxKind.DefaultKeyword;
		case ParsingContext.ClassMembers:
			return this.isClassMemberDeclarationStart();
		case ParsingContext.EnumMembers:
			return isTokenAValidIdentifier(this.token());
		case ParsingContext.ArrayLiteralMembers:
			return this.isStartOfExpression();
		case ParsingContext.TableLiteralMembers:
			return this.isTableMemberDeclarationStart();
		case ParsingContext.VariableDeclarations:
			return isTokenAValidIdentifier(this.token());
		case ParsingContext.Parameters:
			return isTokenAValidIdentifier(this.token()) || kind === SyntaxKind.DotDotDotToken;
		case ParsingContext.ArgumentExpressions:
			return this.isStartOfExpression();
		}
	}

	private isStartOfStatement(): boolean {
		switch (this.token().kind) {
		case SyntaxKind.SemicolonToken:
		case SyntaxKind.IfKeyword:
		case SyntaxKind.WhileKeyword:
		case SyntaxKind.DoKeyword:
		case SyntaxKind.ForKeyword:
		case SyntaxKind.ForEachKeyword:
		case SyntaxKind.SwitchKeyword:
		case SyntaxKind.LocalKeyword:
		case SyntaxKind.ConstKeyword:
		case SyntaxKind.ReturnKeyword:
		case SyntaxKind.YieldKeyword:
		case SyntaxKind.ContinueKeyword:
		case SyntaxKind.BreakKeyword:
		case SyntaxKind.FunctionKeyword:
		case SyntaxKind.ClassKeyword:
		case SyntaxKind.EnumKeyword:
		case SyntaxKind.OpenBraceToken:
		case SyntaxKind.TryKeyword:
		case SyntaxKind.ThrowKeyword:
		// 'catch' and does not actually indicate that the code is part of a statement,
		// however, we say they are here so that we may gracefully parse them and error later.
		// falls through
		case SyntaxKind.CatchKeyword:
			return true;
		default:
			return this.isStartOfExpression();
		}
	}

	private isStartOfExpression(): boolean {
		switch (this.token().kind) {
		case SyntaxKind.MinusToken:
		case SyntaxKind.TildeToken:
		case SyntaxKind.ExclamationToken:
		case SyntaxKind.AtToken:

		case SyntaxKind.MinusMinusToken:
		case SyntaxKind.PlusPlusToken:
		case SyntaxKind.ColonColonToken:

		case SyntaxKind.CloneKeyword:
		case SyntaxKind.DeleteKeyword:
		case SyntaxKind.TypeOfKeyword:
		case SyntaxKind.ResumeKeyword:

		case SyntaxKind.IdentifierToken:
		case SyntaxKind.ConstructorKeyword:
		case SyntaxKind.ThisKeyword:
		case SyntaxKind.BaseKeyword:
		case SyntaxKind.__FILE__Keyword:
		case SyntaxKind.__LINE__Keyword:

		case SyntaxKind.IntegerToken:
		case SyntaxKind.FloatToken:
		case SyntaxKind.TrueKeyword:
		case SyntaxKind.FalseKeyword:
		case SyntaxKind.NullKeyword:
		case SyntaxKind.StringToken:
		case SyntaxKind.VerbatimStringToken:

		case SyntaxKind.OpenBraceToken:
		case SyntaxKind.OpenBracketToken:

		case SyntaxKind.FunctionKeyword:
		case SyntaxKind.ClassKeyword:
		case SyntaxKind.RawCallKeyword:
			return true;
		default:
			return false;
		}
	}

	private isClassMemberDeclarationStart(): boolean {
		switch (this.token().kind) {
		case SyntaxKind.FunctionKeyword:
		case SyntaxKind.ConstructorKeyword:
		case SyntaxKind.IdentifierToken:
		case SyntaxKind.StaticKeyword:
			return true;
		default:
			return false;
		}
	}

	private isTableMemberDeclarationStart(): boolean {
		switch (this.token().kind) {
		case SyntaxKind.FunctionKeyword:
		case SyntaxKind.ConstructorKeyword:
		case SyntaxKind.IdentifierToken:
		case SyntaxKind.StringToken:
		case SyntaxKind.VerbatimStringToken:
		case SyntaxKind.OpenBracketToken:
			return true;
		default:
			return false;
		}
	}

	private abortParsingListOrMoveToNextToken(context: ParsingContext): boolean {
		this.parsingContextErrors(context);

		for (let flag: ParsingContext = 1; flag < ParsingContext.Count; flag <<= 1) {
			if (!(this.parsingContext & flag)) {
				continue;
			}

			if (this.isListElement(flag, /*inErrorRecovery*/ true) || this.isListTerminator(flag)) {
				return true;
			}
		}

		this.next();
		return false;
	}

	private parsingContextErrors(context: ParsingContext) {
		switch (context) {
		case ParsingContext.SourceElements:
		case ParsingContext.BlockStatements:
		case ParsingContext.SwitchClauseStatements:
			return this.diagnosticAtCurrentToken("Declaration or statement expected.");
		case ParsingContext.SwitchClauses:
			return this.diagnosticAtCurrentToken("'case' or 'default' expected.");
		case ParsingContext.ClassMembers:
			return this.diagnosticAtCurrentToken("Table element expected (identifier, 'static' or 'function').");
		case ParsingContext.EnumMembers:
			return this.diagnosticAtCurrentToken("Enum member expected (identifier).");
		case ParsingContext.ArrayLiteralMembers:
			return this.diagnosticAtCurrentToken("Array element expected (expression).");
		case ParsingContext.TableLiteralMembers:
			return isTokenAKeyword(this.token()) ?
				this.diagnosticAtCurrentToken(`${TokenToString.get(this.token().kind)} is not allowed as a property name. Wrap it in a string literal if you wish to use it.`) :
				this.diagnosticAtCurrentToken("Table element expected (identifier, 'function', '[]' or a string literal).");
		case ParsingContext.VariableDeclarations:
		case ParsingContext.Parameters:
			return isTokenAKeyword(this.token()) ?
				this.diagnosticAtCurrentToken(`${TokenToString.get(this.token().kind)} is not allowed as a parameter name.`) :
				this.diagnosticAtCurrentToken("Parameter declaration expected (identifier).");
		case ParsingContext.ArgumentExpressions:
			return this.diagnosticAtCurrentToken("Argument expression expected.");
		}
	}

	private parseCommaExpression(): CommaExpression | Expression {
		const expressions = [this.parseBinaryExpression()];
		while (this.parseOptional(SyntaxKind.CommaToken)) {
			expressions.push(this.parseBinaryExpression());
		}

		if (expressions.length === 1) {
			return expressions[0];
		}

		return expressions;
	}
	
	private parseBinaryExpressionOrHigher(precedence: OperatorPrecedence) {
		const start = this.token().start;
		const leftOperand = this.parseUnaryExpressionOrHigher();
		return this.parseBinaryExpressionRest(start, precedence, leftOperand);
	}

	private parseBinaryExpressionRest(start: number, precedence: OperatorPrecedence, leftOperand: Expression): Expression {
		while (true) {
			const newPrecedence = getBinaryOperatorPrecedence(this.token().kind);
											// The only right-left operators
			const consumeCurrentOperator = newPrecedence === OperatorPrecedence.AssignmentOrConditional ?
				newPrecedence >= precedence :
				newPrecedence > precedence;
			
			if (!consumeCurrentOperator) {
				break;
			}
			
			leftOperand = this.token().kind === SyntaxKind.QuestionToken ?
				this.parseConditionalExpression(leftOperand, start) :
				createBinaryExpression(start, leftOperand, this.token(), this.parseBinaryExpressionOrHigher(newPrecedence));
		}

		return leftOperand;
	}

	private parseUnaryExpressionOrHigher(): Expression {
		switch (this.token().kind) {
		case SyntaxKind.MinusToken:
		case SyntaxKind.TildeToken:
		case SyntaxKind.ExclamationToken:
			return this.parsePrefixUnaryExpression();
		case SyntaxKind.ColonColonToken:
			return this.parseGlobalExpression();
		case SyntaxKind.PlusPlusToken:
		case SyntaxKind.MinusMinusToken:
			return this.parsePrefixUpdateExpression();
		case SyntaxKind.DeleteKeyword:
			return this.parseDeleteExpression();
		case SyntaxKind.TypeOfKeyword:
			return this.parseTypeOfExpression();
		case SyntaxKind.ResumeKeyword:
			return this.parseResumeExpression();
		case SyntaxKind.CloneKeyword:
			return this.parseCloneExpression();
		case SyntaxKind.RawCallKeyword:
			return this.parseRawCallExpression();
		default:
			const expression = this.parsePrimaryExpression();
			return this.parsePostFixExpression(expression);
		}
	}

	private parsePostFixExpression(expression: Expression): Expression {
		switch (this.token().kind) {
		case SyntaxKind.PlusPlusToken:
		case SyntaxKind.MinusMinusToken:
			return this.parsePostFixUpdateExpression(expression);
		case SyntaxKind.DotToken:
			expression = this.parseMemberAccessExpression(expression);
			return this.parsePostFixExpression(expression);
		case SyntaxKind.OpenBracketToken:
			expression = this.parseSubscriptExpression(expression);
			return this.parsePostFixExpression(expression);
		case SyntaxKind.OpenParenthesisToken:
			expression = this.parseCallExpression(expression);
			return this.parsePostFixExpression(expression);
		default:
			return expression;
		}
	}

	private parsePrimaryExpression() {
		switch (this.token().kind) {
		case SyntaxKind.StringToken:
		case SyntaxKind.VerbatimStringToken:
		case SyntaxKind.IntegerToken:
		case SyntaxKind.FloatToken:
			return this.parseLiteralExpression();
		case SyntaxKind.ThisKeyword:
		case SyntaxKind.BaseKeyword:
		case SyntaxKind.NullKeyword:
		case SyntaxKind.TrueKeyword:
		case SyntaxKind.FalseKeyword:
			return this.parseTokenNode<PrimaryExpression>();
		case SyntaxKind.OpenParenthesisToken:
			return this.parseParenthesisedExpression();
		case SyntaxKind.OpenBracketToken:
			return this.parseArrayLiteralExpression();
		case SyntaxKind.OpenBraceToken:
			return this.parseTableLiteralExpression();
		case SyntaxKind.FunctionKeyword:
			return this.parseFunctionExpression();
		case SyntaxKind.AtToken:
			return this.parseFunctionExpression();
		default:
			return this.parseIdentifierWithDiagnostic("Expression expected.");
		}
	}

	private parseIdentifierWithDiagnostic(message?: string): Identifier {
		const token = this.token();
		const start = token.start;
		if (isTokenAValidIdentifier(token)) {
			this.next();
			return createIdentifier(start, token.end, token.value);
		}

		if (!message) {
			const representation = TokenToString.get(token.kind);

			message = "Identifier expected." +
				(isTokenAKeyword(token) ? `'${representation}' is a reserved word that cannot be used here.` : "");
		}
		
		this.diagnosticAtCurrentToken(message);
		return createMissingNode(start, SyntaxKind.Identifier); 
	}

	private parseLiteralExpression() {

	}

	private parseConditionalExpression(condition: Expression, start: number): Expression {
		this.parseExpected(SyntaxKind.QuestionToken);
		const whenTrue = this.parseExpression();
		const whenFalse = this.parseExpected(SyntaxKind.ColonToken) ? this.parseExpression() : undefined;
		return createConditionalExpression(start, condition, whenTrue, whenFalse);
	}

	private parseStatement(): Statement {
		switch (this.token().kind) {
		case SyntaxKind.SemicolonToken:
			return this.parseEmptyStatement();
		case SyntaxKind.OpenBraceToken:
			return this.parseBlockStatement(); 
		case SyntaxKind.IfKeyword:
			return this.parseIfStatement();
		case SyntaxKind.WhileKeyword:
			return this.parseWhileStatement();
		case SyntaxKind.DoKeyword:
			return this.parseDoStatement();
		case SyntaxKind.ForKeyword:
			return this.parseForStatement();
		case SyntaxKind.ForEachKeyword:
			return this.parseForEachStatement();
		case SyntaxKind.SwitchKeyword:
			return this.switchStatement();
		case SyntaxKind.LocalKeyword:
			return this.localStatement();
		case SyntaxKind.ConstKeyword:
			return this.constStatement();
		case SyntaxKind.ReturnKeyword:
			return this.returnStatement();
		case SyntaxKind.YieldKeyword:
			return this.yieldStatement();
		case SyntaxKind.ContinueKeyword:
			return this.continueStatement();
		case SyntaxKind.BreakKeyword:
			return this.breakStatement();
		case SyntaxKind.FunctionKeyword:
			return this.functionStatement();
		case SyntaxKind.ClassKeyword:
			return this.classStatement();
		case SyntaxKind.EnumKeyword:
			return this.enumStatement();
		case SyntaxKind.TryKeyword:
			return this.tryCatchStatement();
		case SyntaxKind.ThrowKeyword:
			return this.throwStatement();
		default:
			return this.parseCommaExpression();
		}
	}

	private parseEmptyStatement(): EmptyStatement {
		const start = this.token().start;
		const end = this.parseEndToken(SyntaxKind.SemicolonToken);
		return createEmptyStatement(start, end);
	}

	private parseIfStatement(): IfStatement {
		const start = this.token().start;
		this.parseExpected(SyntaxKind.IfKeyword);
		this.parseExpected(SyntaxKind.OpenParenthesisToken);
		const expression = this.parseCommaExpression();
		this.parseExpected(SyntaxKind.CloseParenthesisToken);
		const thenStatement = this.parseStatement();
		const elseStatement = this.parseOptional(SyntaxKind.ElseKeyword) ? this.parseStatement() : undefined;
		return createIfStatement(start, expression, thenStatement, elseStatement);
	}

	private parseBlockStatement(): Block {
		const start = this.token().start;
		this.parseExpected(SyntaxKind.OpenBraceToken);
		const statements = this.parseList(ParsingContext.BlockStatements, this.parseStatement);
		const end = this.parseEndToken(SyntaxKind.CloseBraceToken);
		return createBlockStatement(start, statements, end);
	}

	private parseWhileStatement(): WhileStatement {
		const start = this.token().start;
		this.parseExpected(SyntaxKind.WhileKeyword);
		this.parseExpected(SyntaxKind.OpenParenthesisToken);
		const expression = this.parseCommaExpression();
		this.parseExpected(SyntaxKind.CloseParenthesisToken);
		const statement = this.parseStatement();
		return createWhileStatement(start, expression, statement);
	}

	private parseDoStatement(): DoStatement {
		const start = this.token().start;
		this.parseExpected(SyntaxKind.DoKeyword);
		const statement = this.parseStatement();
		this.parseExpected(SyntaxKind.WhileKeyword);
		this.parseExpected(SyntaxKind.OpenParenthesisToken);
		const expression = this.parseCommaExpression();
		const end = this.parseEndToken(SyntaxKind.CloseParenthesisToken);
		return createDoStatement(start, statement, expression, end);
	}

	private parseForStatement(): ForStatement {
		const start = this.token().start;
		this.parseExpected(SyntaxKind.ForKeyword);
		this.parseExpected(SyntaxKind.OpenParenthesisToken);

		let initialiser: LocalStatement | Expression | undefined;
		if (this.token().kind === SyntaxKind.LocalKeyword) {
			initialiser = this.localStatement();
		} else if (this.token().kind !== SyntaxKind.SemicolonToken) {
			initialiser = this.commaExpression();
		}

		this.parseExpected(SyntaxKind.SemicolonToken);
		const condition = this.token().kind !== SyntaxKind.SemicolonToken ? this.parseExpression() : undefined;
		this.parseExpected(SyntaxKind.SemicolonToken);
		const incrementor = this.token().kind !== SyntaxKind.CloseParenthesisToken ? this.parseExpression() : undefined;
		this.parseExpected(SyntaxKind.CloseParenthesisToken);
		const statement = this.parseStatement();
		return createForStatement(start, initialiser, condition, incrementor, statement);
	}

	private parseForEachStatement(): ForEachStatement {
		const start = this.token().start;
		this.parseExpected(SyntaxKind.ForEachKeyword);
		this.parseExpected(SyntaxKind.OpenParenthesisToken);
		let index: Identifier | undefined;
		let value = this.parseIdentifierWithDiagnostic();
		if (this.parseOptional(SyntaxKind.CommaToken)) {
			index = value;
			value = this.parseIdentifierWithDiagnostic();
		}
		this.parseExpected(SyntaxKind.InKeyword);
		const iterable = this.parseExpression();
		this.parseExpected(SyntaxKind.CloseBraceToken);
		const statement = this.parseStatement();
		return createForEachStatement(start, index, value, iterable, statement);
	}
}