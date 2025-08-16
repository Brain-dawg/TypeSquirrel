import { Lexer } from "./lexer";
import { Node, SyntaxKind, NodeArray, forEachChild, Token, VScriptDiagnostic, DiagnosticSeverity, Identifier, TokenToString, isTokenAValidIdentifier, isTokenAKeyword, Expression, PrefixUnaryExpression, VariableDeclaration, Parameter, VariedArgs, Name, isTokenAString, Statement, BinaryOperator, BinaryExpression, OperatorPrecedence, isAssignmentOperator, getBinaryOperatorPrecedence, PrimaryExpression, ConditionalExpression, PrefixUnaryOperator, DeleteExpression, TypeOfExpression, ResumeExpression, CloneExpression, RawCallExpression, RootAccessExpression, LiteralExpression, TokenToExpression, ParenthesisedExpression, ArrayLiteralExpression, TableLiteralExpression, TableLiteralMember, TableMethod, TableConstructor, TablePropertyAssignment, FunctionExpression, LambdaExpression, ClassExpression, PostfixUnaryExpression, PostfixUnaryOperator, PropertyAccessExpression, ElementAccessExpression, CallExpression, EmptyStatement, BlockStatement, IfStatement, WhileStatement, DoStatement, ForStatement, LocalStatement, ForEachStatement, SwitchStatement, CaseBlock, CaseClause, DefaultClause, LocalFunctionDeclaration, ConstStatement, ReturnStatement, YieldStatement, ContinueStatement, BreakStatement, FunctionDeclaration, ClassDeclaration, ClassMember, ClassMethod, ClassConstructor, ClassPropertyAssignment, EnumDeclaration, EnumMember, TryStatement, CatchClause, ThrowStatement, ExpressionStatement, SourceFile, isValidSlotExpression, ForInitialiser, ParameterDeclaration, StringLiteral, VerbatimStringLiteral, ComputedName, PostCallInitialiser, PostCallInitialiserPropertyAssignment } from "./types";


const enum ParsingContext {
	SourceElements         = 1 << 0,  // Elements in source file
	BlockStatements        = 1 << 1,  // Statements in block
	SwitchClauseStatements = 1 << 3,  // Statements in switch clause
	SwitchClauses          = 1 << 2,  // Clauses in switch statement
	ClassMembers           = 1 << 4,  // Members in class declaration
	EnumMembers            = 1 << 5,  // Members in enum declaration
	TableLiteralMembers    = 1 << 6,  // Members in object literal
	ArrayLiteralMembers    = 1 << 7,  // Members in array literal
	Parameters             = 1 << 8,  // Parameters in parameter list
	ArgumentExpressions    = 1 << 9,  // Function call arguments, pretty much the same as array literal
	PostCallInitialisation = 1 << 10, // Post call initialisation, e.g. Vector(1, 2, 3) {x = 3, y = 3, z = 3}
	Count                             // +1 than the last entry, used for loop iteration
}

const enum AllowedPropertyName {
	Identifier = 0,
	String     = 1 << 0,
	Computed   = 1 << 1
}

export function isMissingNode(node: Node): boolean {
	if (node.kind === SyntaxKind.NodeArray) {
		return isMissingList(node as NodeArray<Node>);
	}
	return node.start === node.end;
}

export interface MissingList<T extends Node> extends NodeArray<T> {
	readonly isMissingList: true;
}

export function isMissingList(arr: NodeArray<Node>): boolean {
	return !!(arr as MissingList<Node>).isMissingList;
}

function overrideParentInImmediateChildren(node: Node) {
	forEachChild(node, (childNode: Node) => childNode.parent = node);
}

export class Parser {
	private readonly lexer: Lexer;

	private parsingContext: number;

	private token: Token<SyntaxKind>;

	private readonly diagnostics: VScriptDiagnostic[];

	constructor(lexer: Lexer) {
		this.lexer = lexer;

		this.parsingContext = 0;
		this.token = lexer.lex();

		this.diagnostics = [];
	}

	private diagnosticAtCurrentToken(message: string, severity: DiagnosticSeverity = DiagnosticSeverity.Error): void {
		this.diagnostic(message, this.token.start, this.token.end, severity);
	}

	private diagnostic(message: string, start: number, end: number, severity: DiagnosticSeverity = DiagnosticSeverity.Error): void {
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

	public getDiagnostics(): VScriptDiagnostic[] {
		return this.diagnostics;
	}

	private next(): SyntaxKind {
		this.token = this.lexer.lex();
		return this.token.kind;
	}


	private createMissingList<T extends Node>(): MissingList<T> {
		const start = this.token.start;
		const list: MissingList<T> = {
			kind: SyntaxKind.NodeArray,
			start,
			end: start,
			elements: [],
			isMissingList: true
		};
		return list;
	}

	// This one works as missing expression (inherently a statement) too
	private createMissingIdentifier(): Identifier {
		const pos = this.token.start;
		return { kind: SyntaxKind.Identifier, start: pos, end: pos, value: "" };
	}

	private parseOptional(kind: SyntaxKind): boolean {
		if (this.token.kind === kind) {
			this.next();
			return true;
		}

		return false;
	}

	private parseExpected(kind: SyntaxKind, additionalMessage: string = ""): boolean {
		if (this.parseOptional(kind)) {
			return true;
		}

		this.diagnosticAtCurrentToken("Expected " + additionalMessage + `'${TokenToString.get(kind)}'.`);
		return false;
	}

	private canParseEndOfStatement(): boolean {
		return this.token.kind === SyntaxKind.SemicolonToken ||
			this.token.kind === SyntaxKind.CloseBraceToken ||
			this.token.kind === SyntaxKind.EndOfFileToken ||
			this.lexer.hasPrecedingLineBreak;
	}

	private parseEndOfStatement(): void {
		if (!this.canParseEndOfStatement()) {
			this.diagnosticAtCurrentToken("End of statement expected.");
			return;
		}

		if (this.token.kind === SyntaxKind.SemicolonToken) {
			this.next();
		}
	}

	private parseIdentifierWithDiagnostic(message?: string): Identifier {
		const token = this.token;
		if (isTokenAValidIdentifier(token)) {
			this.next();
			return {
				kind: SyntaxKind.Identifier,
				start: token.start,
				end: token.end,
				value: token.value
			};
		}

		if (!message) {
			message = "Identifier expected." + (isTokenAKeyword(token) ?
				` '${TokenToString.get(token.kind)}' is a reserved word that cannot be used here.` : "");
		}

		this.diagnosticAtCurrentToken(message);
		return this.createMissingIdentifier();
	}

	private parseOptionalInitialiser(assignment: SyntaxKind.ColonToken | SyntaxKind.EqualsToken): Expression | undefined {
		if (!this.parseOptional(assignment)) {
			// If the user has used a wrong assignment token
			if (!this.parseOptional(assignment === SyntaxKind.EqualsToken ? SyntaxKind.ColonToken : SyntaxKind.EqualsToken)) {
				return undefined;
			}
		}

		return this.parseExpression();
	}

	private parseInitialiser(assignment: SyntaxKind.ColonToken | SyntaxKind.EqualsToken): Expression {
		if (!this.parseExpected(assignment)) {
			// If the user has used a wrong assignment token
			this.parseOptional(assignment === SyntaxKind.EqualsToken ? SyntaxKind.ColonToken : SyntaxKind.EqualsToken);
		}

		return this.parseExpression();
	}

	private scalarLiteralErrors(expression: Expression) {
		switch (expression.kind) {
		case SyntaxKind.IntegerLiteral:
		case SyntaxKind.FloatLiteral:
		case SyntaxKind.StringLiteral:
		case SyntaxKind.VerbatimStringLiteral:
		case SyntaxKind.TrueLiteral:
		case SyntaxKind.FalseLiteral:
			return;
		case SyntaxKind.PrefixUnaryExpression:
			const operandKind = (expression as PrefixUnaryExpression).operand.kind;
			if (operandKind !== SyntaxKind.IntegerLiteral && operandKind !== SyntaxKind.FloatLiteral) {
				this.diagnostic("Expected number.", expression.start, expression.end);
			}
			return;
		default:
			this.diagnostic("Expected number, string or boolean.", expression.start, expression.end);
		}
	}

	private parseSimpleVariableDeclaration(): VariableDeclaration {
		const start = this.token.start;

		const name = this.parseIdentifierWithDiagnostic();

		const end = this.lexer.lastToken.end;
		const node: VariableDeclaration = { kind: SyntaxKind.VariableDeclaration, start, end, name };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseVariableDeclaration(message?: string): VariableDeclaration {
		const start = this.token.start;

		const name = this.parseIdentifierWithDiagnostic(message);
		const initialiser = this.parseOptionalInitialiser(SyntaxKind.EqualsToken);

		const end = this.lexer.lastToken.end;
		const node: VariableDeclaration = { kind: SyntaxKind.VariableDeclaration, start, end, name, initialiser };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseFunctionEnvironmentAndParameters(): { environment?: Expression, parameters: NodeArray<Parameter> } {
		let environment: Expression | undefined;
		if (this.parseOptional(SyntaxKind.OpenBracketToken)) {
			environment = this.parseExpression();
			this.parseExpected(SyntaxKind.CloseBracketToken);
		}

		if (!this.parseExpected(SyntaxKind.OpenParenthesisToken)) {
			return { environment, parameters: this.createMissingList<Parameter>() };
		}

		const parameters = this.parseDelimitedList(ParsingContext.Parameters, this.parseParameter, SyntaxKind.CommaToken, false);
		this.parseExpected(SyntaxKind.CloseParenthesisToken);
		return { environment, parameters };
	}

	private parseParameter(): Parameter {
		const start = this.token.start;
		if (this.parseOptional(SyntaxKind.DotDotDotToken)) {
			if (this.token.kind !== SyntaxKind.CloseParenthesisToken) {
				this.diagnosticAtCurrentToken("Expected ')', varied argument token must be the last parameter.");
			}

			const end = this.lexer.lastToken.end;
			const node: VariedArgs = { kind: SyntaxKind.VariedArgs, start, end };

			return node;
		}

		const name = this.parseIdentifierWithDiagnostic();
		const initialiser = this.parseOptionalInitialiser(SyntaxKind.EqualsToken);

		const end = this.lexer.lastToken.end;
		const node: ParameterDeclaration = { kind: SyntaxKind.ParameterDeclaration, start, end, name, initialiser };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseProperty(allowedPropertyNames: number, optionalInitialisation: true): { name: Name; initialiser?: Expression };
	private parseProperty(allowedPropertyNames: number, optionalInitialisation: false): { name: Name; initialiser: Expression };
	private parseProperty(allowedPropertyNames: number, optionalInitialisation: boolean): { name: Name; initialiser?: Expression } {
		if (isTokenAValidIdentifier(this.token)) {
			const name = this.parseIdentifierWithDiagnostic();
			const initialiser = optionalInitialisation ?
				this.parseOptionalInitialiser(SyntaxKind.EqualsToken) :
				this.parseInitialiser(SyntaxKind.EqualsToken);
			return { name, initialiser };
		}
		if (isTokenAString(this.token)) {
			const name = this.parseLiteralExpression();
			const initialiser = optionalInitialisation ?
				this.parseOptionalInitialiser(SyntaxKind.ColonToken) :
				this.parseInitialiser(SyntaxKind.ColonToken);

			if (!(allowedPropertyNames & AllowedPropertyName.String)) {
				this.diagnostic("String property name is not allowed here.", name.start, name.end);
			}
			return { name: name as StringLiteral | VerbatimStringLiteral, initialiser };
		}
		if (this.token.kind === SyntaxKind.OpenBracketToken) {
			const start = this.token.start;
			this.parseExpected(SyntaxKind.OpenBracketToken);
			const expression = this.parseCommaExpression();
			this.parseExpected(SyntaxKind.CloseBracketToken);
			const end = this.lexer.lastToken.end;

			const name: ComputedName = { kind: SyntaxKind.ComputedName, start, end, expression };

			const initialiser = optionalInitialisation ?
				this.parseOptionalInitialiser(SyntaxKind.EqualsToken) :
				this.parseInitialiser(SyntaxKind.EqualsToken);

			if (!(allowedPropertyNames & AllowedPropertyName.Computed)) {
				this.diagnostic("Computed property name is not allowed here.", start, end);
			}
			return { name, initialiser };
		}

		this.diagnosticAtCurrentToken("Expected property.");
		const name = this.createMissingIdentifier();
		const initialiser = this.createMissingIdentifier();
		return { name, initialiser };
	}

	private parseMethod(): { name: Identifier, environment?: Expression, parameters: NodeArray<Parameter>, statement: Statement } {
		this.parseExpected(SyntaxKind.FunctionKeyword);
		const name = this.parseIdentifierWithDiagnostic();
		const { environment, parameters } = this.parseFunctionEnvironmentAndParameters();
		const statement = this.parseStatement();
		return { name, environment, parameters, statement };
	}

	private parseConstructor(): { environment?: Expression, parameters: NodeArray<Parameter>, statement: Statement } {
		this.parseExpected(SyntaxKind.ConstructorKeyword);
		const { environment, parameters } = this.parseFunctionEnvironmentAndParameters();
		const statement = this.parseStatement();
		return { environment, parameters, statement };
	}

	private parseCallArguments(): { argumentExpressions: NodeArray<Expression>, postCallInitialiser?: PostCallInitialiser } {
		let argumentExpressions: NodeArray<Expression>;
		if (this.parseExpected(SyntaxKind.OpenParenthesisToken)) {
			argumentExpressions = this.parseDelimitedList(ParsingContext.ArgumentExpressions, this.parseExpression, SyntaxKind.CommaToken, /*isDelimiterOptional*/ true);
			this.parseExpected(SyntaxKind.CloseParenthesisToken);
		} else {
			argumentExpressions = this.createMissingList<Expression>();
		}

		let postCallInitialiser: PostCallInitialiser | undefined;
		
		const start = this.token.start;
		if (this.parseOptional(SyntaxKind.OpenBraceToken)) {
			const members = this.parseDelimitedList(ParsingContext.PostCallInitialisation, this.parsePostCallInitialiserProperty, SyntaxKind.CommaToken, /*isDelimiterOptional*/ true);
			this.parseExpected(SyntaxKind.CloseBraceToken);

			const end = this.lexer.lastToken.end;
			postCallInitialiser = { kind: SyntaxKind.PostCallInitialiser, start, end, members };
		}

		return { argumentExpressions, postCallInitialiser };
	}

	private parseList<T extends Node>(context: ParsingContext, parseElement: () => T): NodeArray<T> {
		parseElement = parseElement.bind(this);

		const saveParsingContext = this.parsingContext;
		this.parsingContext |= context;
		const elements: T[] = [];
		const start = this.token.start;

		while (!this.isListTerminator(context)) {
			if (this.isListElement(context)) {
				elements.push(parseElement());
				continue;
			}

			if (this.abortParsingListOrMoveToNextToken(context)) {
				break;
			}
		}

		this.parsingContext = saveParsingContext;

		const end = this.lexer.lastToken.end;
		const node: NodeArray<T> = { kind: SyntaxKind.NodeArray, start, end, elements };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseDelimitedList<T extends Node>(context: ParsingContext, parseElement: () => T, delimiter: SyntaxKind.CommaToken | SyntaxKind.SemicolonToken, isDelimiterOptional: boolean): NodeArray<T> {
		parseElement = parseElement.bind(this);
		
		const saveParsingContext = this.parsingContext;
		this.parsingContext |= context;
		const elements: T[] = [];
		const start = this.token.start;

		const fallbackDelimiter = delimiter === SyntaxKind.CommaToken ? SyntaxKind.SemicolonToken : SyntaxKind.CommaToken;

		while (true) {
			if (this.isListElement(context)) {
				elements.push(parseElement());

				if (this.parseOptional(delimiter)) {
					continue;
				}
				// Do not produce an error if we have a terminator right after the last element
				if (this.isListTerminator(context)) {
					break;
				}

				if (!isDelimiterOptional) {
					this.parseExpected(delimiter);
				}
				
				// If the user has used a wrong delimiter token
				if (this.token.kind === fallbackDelimiter) {
					this.parseExpected(delimiter);
					this.next();
				}

				continue;
			}

			if (this.isListTerminator(context)) {
				break;
			}

			if (this.abortParsingListOrMoveToNextToken(context)) {
				break;
			}
		}

		this.parsingContext = saveParsingContext;

		const end = this.lexer.lastToken.end;
		const node: NodeArray<T> = { kind: SyntaxKind.NodeArray, start, end, elements };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private isListTerminator(parsingContext: ParsingContext): boolean {
		const kind = this.token.kind;
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
		case ParsingContext.PostCallInitialisation:
			return kind === SyntaxKind.CloseBraceToken;
		case ParsingContext.SwitchClauseStatements:
			return kind === SyntaxKind.CloseBraceToken || kind === SyntaxKind.CaseKeyword || kind === SyntaxKind.DefaultKeyword;
		case ParsingContext.ArrayLiteralMembers:
			return kind === SyntaxKind.CloseBracketToken;
		case ParsingContext.Parameters:
		case ParsingContext.ArgumentExpressions:
			return kind === SyntaxKind.CloseParenthesisToken;
		default:
			return false;
		}
	}

	private isListElement(context: ParsingContext): boolean {
		const kind = this.token.kind;

		switch (context) {
		case ParsingContext.SourceElements:
		case ParsingContext.BlockStatements:
		case ParsingContext.SwitchClauseStatements:
			return this.isStartOfStatement();
		case ParsingContext.SwitchClauses:
			return kind === SyntaxKind.CaseKeyword || kind === SyntaxKind.DefaultKeyword;
		case ParsingContext.ClassMembers:
			return this.isClassMemberDeclarationStart();
		case ParsingContext.EnumMembers:
			return isTokenAValidIdentifier(this.token);
		case ParsingContext.ArrayLiteralMembers:
			return this.isStartOfExpression();
		case ParsingContext.TableLiteralMembers:
			return this.isTableMemberDeclarationStart();
		case ParsingContext.Parameters:
			return isTokenAValidIdentifier(this.token) || kind === SyntaxKind.DotDotDotToken;
		case ParsingContext.ArgumentExpressions:
			return this.isStartOfExpression();
		case ParsingContext.PostCallInitialisation:
			return isTokenAValidIdentifier(this.token) || kind === SyntaxKind.OpenBracketToken;
		default:
			return false;
		}
	}

	private isStartOfStatement(): boolean {
		switch (this.token.kind) {
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
		case SyntaxKind.ThrowKeyword:
		case SyntaxKind.TryKeyword:	
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
		switch (this.token.kind) {
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
		case SyntaxKind.OpenParenthesisToken:
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
		switch (this.token.kind) {
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
		switch (this.token.kind) {
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

			// If we're in error recovery, then we don't want to treat ';' as an empty statement.
			// The problem is that ';' can show up in far too many contexts, and if we see one
			// and assume it's a statement, then we may bail out inappropriately from whatever
			// we're parsing.  For example, if we have a semicolon in the middle of a class, then
			// we really don't want to assume the class is over and we're on a statement in the
			// outer module.  We just want to consume and move on.
			if ((this.token.kind !== SyntaxKind.SemicolonToken && this.isListElement(flag)) || this.isListTerminator(flag)) {
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
			return isTokenAKeyword(this.token) ?
				this.diagnosticAtCurrentToken(`${TokenToString.get(this.token.kind)} is not allowed as a property name. Wrap it in the ["..."] if you wish to use it.`) :
				this.diagnosticAtCurrentToken("Class member expected.");
		case ParsingContext.EnumMembers:
			return isTokenAKeyword(this.token) ?
				this.diagnosticAtCurrentToken(`${TokenToString.get(this.token.kind)} is not allowed as a property name.`) :
				this.diagnosticAtCurrentToken("Enum member expected.");
		case ParsingContext.ArrayLiteralMembers:
			return this.diagnosticAtCurrentToken("Array element expected.");
		case ParsingContext.TableLiteralMembers:
			return isTokenAKeyword(this.token) ?
				this.diagnosticAtCurrentToken(`${TokenToString.get(this.token.kind)} is not allowed as a property name. Wrap it in the quotes if you wish to use it.`) :
				this.diagnosticAtCurrentToken("Table member expected.");
		case ParsingContext.Parameters:
			return isTokenAKeyword(this.token) ?
				this.diagnosticAtCurrentToken(`${TokenToString.get(this.token.kind)} is not allowed as a parameter name.`) :
				this.diagnosticAtCurrentToken("Parameter declaration or '...' expected.");
		case ParsingContext.ArgumentExpressions:
			return this.diagnosticAtCurrentToken("Argument expression expected.");
		case ParsingContext.PostCallInitialisation:
			return this.diagnosticAtCurrentToken("Property assignment expected.");
		}
	}

	public parseSourceFile(): SourceFile {
		const start = 0;

		const statements = this.parseList(ParsingContext.SourceElements, this.parseStatementWithEnd);
		const eof = this.lexer.lex();
		if (eof.kind !== SyntaxKind.EndOfFileToken) {
			this.diagnosticAtCurrentToken("End of file expected");
		}

		const end = eof.end;
		const node: SourceFile = { kind: SyntaxKind.SourceFile, start, end, statements };
		overrideParentInImmediateChildren(node);

		return node;
	} 

	private createBinaryExpression(start: number, left: Expression, operator: BinaryOperator, right: Expression): BinaryExpression {
		const end = this.lexer.lastToken.end;
		const node: BinaryExpression = { kind: SyntaxKind.BinaryExpression, start, end, left, operator, right };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseCommaExpression(message?: string): Expression {
		const start = this.token.start;
		let expr = this.parseExpression(message);
		while (this.parseOptional(SyntaxKind.CommaToken)) {
			expr = this.createBinaryExpression(start, expr, SyntaxKind.CommaToken, this.parseExpression());
		}
		return expr;
	}

	private parseExpression(message?: string): Expression {
		const start = this.token.start;
		let expr = this.parseBinaryExpressionOrHigher(OperatorPrecedence.Lowest, message);
		if (isAssignmentOperator(this.token)) {
			if (!isValidSlotExpression(expr.kind)) {
				this.diagnostic("The left-hand side of an assignment expression must be a variable or a property access.", expr.start, expr.end);
			}
			
			const operator = this.token.kind;
			this.next();
			return this.createBinaryExpression(start, expr, operator, this.parseExpression());
		}

		if (this.token.kind === SyntaxKind.QuestionToken) {
			return this.parseConditionalExpression(start, expr);
		}

		return expr;
	}

	private parseBinaryExpressionOrHigher(precedence: OperatorPrecedence, message?: string) {
		const start = this.token.start;
		const leftOperand = this.parseUnaryExpressionOrHigher(message);
		return this.parseBinaryExpressionRest(start, precedence, leftOperand);
	}

	private parseBinaryExpressionRest(start: number, precedence: OperatorPrecedence, leftOperand: Expression): Expression {
		while (true) {
			const newPrecedence = getBinaryOperatorPrecedence(this.token.kind);
			if (newPrecedence <= precedence) {
				break;
			}

			const operator = this.token.kind as BinaryOperator;
			this.next();

			leftOperand = this.createBinaryExpression(start, leftOperand, operator, this.parseBinaryExpressionOrHigher(newPrecedence));
		}

		return leftOperand;
	}

	private parseUnaryExpressionOrHigher(message?: string): Expression {
		switch (this.token.kind) {
		case SyntaxKind.MinusToken:
		case SyntaxKind.TildeToken:
		case SyntaxKind.ExclamationToken:
			return this.parsePrefixUnaryExpression();
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
			const primary: PrimaryExpression = this.parsePrimaryExpression(message);
			return this.parsePostfixExpression(primary);
		}
	}

	private parsePrimaryExpression(message?: string): PrimaryExpression {
		switch (this.token.kind) {
		case SyntaxKind.ColonColonToken:
			return this.parseRootAccessExpression();
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
		case SyntaxKind.__FILE__Keyword:
		case SyntaxKind.__LINE__Keyword:
			return this.parseKeywordExpression();
		case SyntaxKind.OpenParenthesisToken:
			return this.parseParenthesisedExpression();
		case SyntaxKind.OpenBracketToken:
			return this.parseArrayLiteralExpression();
		case SyntaxKind.OpenBraceToken:
			return this.parseTableLiteralExpression();
		case SyntaxKind.FunctionKeyword:
			return this.parseFunctionExpression();
		case SyntaxKind.AtToken:
			return this.parseLambdaExpression();
		case SyntaxKind.ClassKeyword:
			return this.parseClassExpression();
		default:
			return this.parseIdentifierWithDiagnostic(message ? message : "Expression expected.");
		}
	}

	private parsePostfixExpression(expression: Expression): Expression {
		while (true) {
			switch (this.token.kind) {
			case SyntaxKind.PlusPlusToken:
			case SyntaxKind.MinusMinusToken:
				return this.parsePostfixUpdateExpression(expression);
			case SyntaxKind.DotToken:
				expression = this.parsePropertyAccessExpression(expression);
				continue;
			case SyntaxKind.OpenBracketToken:
				expression = this.parseElementAccessExpression(expression);
				continue;
			case SyntaxKind.OpenParenthesisToken:
				expression = this.parseCallExpression(expression);
				continue;
			default:
				return expression;
			}
		}
	}

	private parseConditionalExpression(start: number, condition: Expression): ConditionalExpression {
		this.parseExpected(SyntaxKind.QuestionToken);
		const whenTrue = this.parseCommaExpression();
		const whenFalse = this.parseExpected(SyntaxKind.ColonToken) ?
			this.parseCommaExpression() :
			this.createMissingIdentifier();

		const end = this.lexer.lastToken.end;
		const node: ConditionalExpression = { kind: SyntaxKind.ConditionalExpression, start, end, condition, whenTrue, whenFalse };
		overrideParentInImmediateChildren(node);

		return node;
	}


	private parsePrefixUnaryExpression(): PrefixUnaryExpression {
		const start = this.token.start;

		const operator = this.token.kind as PrefixUnaryOperator;
		this.next();
		const operand = this.parseUnaryExpressionOrHigher();

		const end = this.lexer.lastToken.end;
		const node: PrefixUnaryExpression = { kind: SyntaxKind.PrefixUnaryExpression, start, end, operator, operand };
		overrideParentInImmediateChildren(node);

		return node;
	}


	private parsePrefixUpdateExpression(): PrefixUnaryExpression {
		const start = this.token.start;

		const operator = this.token.kind as PrefixUnaryOperator;
		this.next();

		const operand = this.parseUnaryExpressionOrHigher();
		if (!isValidSlotExpression(operand.kind)) {
			this.diagnostic("The operand of an increment or decrement operator must be a variable or a property access.", operand.start, operand.end);
		}
		const end = this.lexer.lastToken.end;
		const node: PrefixUnaryExpression = { kind: SyntaxKind.PrefixUnaryExpression, start, end, operator, operand };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseDeleteExpression(): DeleteExpression {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.DeleteKeyword);
		const expression = this.parseUnaryExpressionOrHigher();
		if (!isValidSlotExpression(expression.kind)) {
			this.diagnostic("The right-hand side of a delete expression must be a variable or a property access.", expression.start, expression.end);
		}

		const end = this.lexer.lastToken.end;
		const node: DeleteExpression = { kind: SyntaxKind.DeleteExpression, start, end, expression };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseTypeOfExpression(): TypeOfExpression {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.TypeOfKeyword);
		const expression = this.parseUnaryExpressionOrHigher();

		const end = this.lexer.lastToken.end;
		const node: TypeOfExpression = { kind: SyntaxKind.TypeOfExpression, start, end, expression };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseResumeExpression(): ResumeExpression {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.ResumeKeyword);
		const expression = this.parseUnaryExpressionOrHigher();

		const end = this.lexer.lastToken.end;
		const node: ResumeExpression = { kind: SyntaxKind.ResumeExpression, start, end, expression };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseCloneExpression(): CloneExpression {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.CloneKeyword);
		const expression = this.parseUnaryExpressionOrHigher();

		const end = this.lexer.lastToken.end;
		const node: CloneExpression = { kind: SyntaxKind.CloneExpression, start, end, expression };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parsePostCallInitialiserProperty(): PostCallInitialiserPropertyAssignment {
		const start = this.token.start;
		
		const { name, initialiser } = this.parseProperty(AllowedPropertyName.Identifier | AllowedPropertyName.Computed, /*optionalInitialisation*/ false);
		
		const end = this.lexer.lastToken.end;
		const node: PostCallInitialiserPropertyAssignment = { kind: SyntaxKind.PostCallInitialiserPropertyAssignment, start, end, name, initialiser };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseRawCallExpression(): RawCallExpression {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.RawCallKeyword);
		const keywordEnd = this.lexer.lastToken.end;
		const { argumentExpressions, postCallInitialiser } = this.parseCallArguments();
		if (!isMissingList(argumentExpressions) && argumentExpressions.elements.length < 2) {
			this.diagnostic("'rawcall' requires at least 2 parameters (callee and this).", start, keywordEnd);
		}

		const end = this.lexer.lastToken.end;
		const node: RawCallExpression = { kind: SyntaxKind.RawCallExpression, start, end, argumentExpressions, postCallInitialiser };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseRootAccessExpression(): RootAccessExpression {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.ColonColonToken);
		const name = this.parseIdentifierWithDiagnostic();

		const end = this.lexer.lastToken.end;
		const node: RootAccessExpression = { kind: SyntaxKind.RootAccessExpression, start, end, name };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseLiteralExpression(): LiteralExpression {
		const token = this.token;
		const kind = TokenToExpression.get(token.kind);
		if (!kind) {
			this.diagnosticAtCurrentToken("Keyword expression expected");
			return this.createMissingIdentifier();
		}
		this.next();
		return { kind, start: token.start, end: token.end, value: token.value! };
	}

	private parseKeywordExpression(): PrimaryExpression {
		const token = this.token;
		const kind = TokenToExpression.get(token.kind);
		if (!kind) {
			this.diagnosticAtCurrentToken("Keyword expression expected");
			return this.createMissingIdentifier();
		}
		this.next();
		return { kind, start: token.start, end: token.end };
	}

	private parseParenthesisedExpression(): ParenthesisedExpression {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.OpenParenthesisToken);
		const expression = this.parseCommaExpression();
		this.parseExpected(SyntaxKind.CloseParenthesisToken);

		const end = this.lexer.lastToken.end;
		const node: ParenthesisedExpression = { kind: SyntaxKind.ParenthesisedExpression, start, end, expression };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseArrayLiteralExpression(): ArrayLiteralExpression {
		const start = this.token.start;
		
		this.parseExpected(SyntaxKind.OpenBracketToken);
		const elements = this.parseDelimitedList(ParsingContext.ArrayLiteralMembers, this.parseExpression, SyntaxKind.CommaToken, /*isDelimiterOptional*/ true);
		this.parseExpected(SyntaxKind.CloseBracketToken);
		
		const end = this.lexer.lastToken.end;
		const node: ArrayLiteralExpression = { kind: SyntaxKind.ArrayLiteralExpression, start, end, elements };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseTableLiteralExpression(): TableLiteralExpression {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.OpenBraceToken);
		const members = this.parseDelimitedList(ParsingContext.TableLiteralMembers, this.parseTableMember, SyntaxKind.CommaToken, /*isDelimiterOptional*/ true);
		this.parseExpected(SyntaxKind.CloseBraceToken);

		const end = this.lexer.lastToken.end;
		const node: TableLiteralExpression = { kind: SyntaxKind.TableLiteralExpression, start, end, members };
		overrideParentInImmediateChildren(node);

		return node; 
	}

	private parseTableMember(): TableLiteralMember {
		const start = this.token.start;

		switch (this.token.kind) {
		case SyntaxKind.FunctionKeyword: {
			const { name, environment, parameters, statement } = this.parseMethod();

			const end = this.lexer.lastToken.end;
			const node: TableMethod | TableConstructor = name.value === "constructor" ?
				{ kind: SyntaxKind.TableConstructor, start, end, environment, parameters, statement, hasPrecedingFunction: true } :
				{ kind: SyntaxKind.TableMethod, start, end, name, environment, parameters, statement };
			overrideParentInImmediateChildren(node);

			return node;
		}
		case SyntaxKind.ConstructorKeyword: {
			const { environment, parameters, statement } = this.parseConstructor();

			const end = this.lexer.lastToken.end;
			const node: TableConstructor = { kind: SyntaxKind.TableConstructor, start, end, environment, parameters, statement, hasPrecedingFunction: false };
			overrideParentInImmediateChildren(node);

			return node;
		}
		default: {
			const { name, initialiser } = this.parseProperty(AllowedPropertyName.Identifier | AllowedPropertyName.Computed | AllowedPropertyName.String, /*optionalInitialisation*/ false);

			const end = this.lexer.lastToken.end;
			const node: TablePropertyAssignment = { kind: SyntaxKind.TablePropertyAssignment, start, end, name, initialiser };
			overrideParentInImmediateChildren(node);

			return node;
		}
		}
	}

	private parseFunctionExpression(): FunctionExpression {
		const start = this.token.start;
		
		this.parseExpected(SyntaxKind.FunctionKeyword);
		const { environment, parameters } = this.parseFunctionEnvironmentAndParameters();
		const statement = this.parseStatement();

		const end = this.lexer.lastToken.end;
		const node: FunctionExpression = { kind: SyntaxKind.FunctionExpression, start, end, environment, parameters, statement };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseLambdaExpression(): LambdaExpression {
		const start = this.token.start;
		
		this.parseExpected(SyntaxKind.AtToken);
		const { environment, parameters } = this.parseFunctionEnvironmentAndParameters();
		const expression = this.parseExpression();

		const end = this.lexer.lastToken.end;
		const node: LambdaExpression = { kind: SyntaxKind.LambdaExpression, start, end, environment, parameters, expression };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseClassExpression(): ClassExpression {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.ClassKeyword);
		const inherits = this.parseOptional(SyntaxKind.ExtendsKeyword) ? this.parseUnaryExpressionOrHigher() : undefined;
		const members = this.parseClassMembers();

		const end = this.lexer.lastToken.end;
		const node: ClassExpression = { kind: SyntaxKind.ClassExpression, start, end, inherits, members };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parsePostfixUpdateExpression(operand: Expression): PostfixUnaryExpression {
		const start = operand.start;

		const operator = this.token.kind as PostfixUnaryOperator;
		this.next();
		if (!isValidSlotExpression(operand.kind)) {
			this.diagnostic("The operand of an increment or decrement operator must be a variable or a property access.", operand.start, operand.end);
		}

		const end = this.lexer.lastToken.end;
		const node: PostfixUnaryExpression = { kind: SyntaxKind.PostfixUnaryExpression, start, end, operand, operator };
		overrideParentInImmediateChildren(node);

		return node;
	}
	
	private parsePropertyAccessExpression(expression: Expression): PropertyAccessExpression {
		const start = expression.start;

		this.parseExpected(SyntaxKind.DotToken);
		const property = this.parseIdentifierWithDiagnostic();

		const end = this.lexer.lastToken.end;
		const node: PropertyAccessExpression = { kind: SyntaxKind.PropertyAccessExpression, start, end, expression, property };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseElementAccessExpression(expression: Expression): ElementAccessExpression {
		const start = expression.start;

		if (this.lexer.hasPrecedingLineBreak) {
			this.diagnosticAtCurrentToken("A line break is not allowed before an element access expression.");
		}

		this.parseExpected(SyntaxKind.OpenBracketToken);
		const argumentExpression = this.parseExpression();
		this.parseExpected(SyntaxKind.CloseBracketToken);

		const end = this.lexer.lastToken.end;
		const node: ElementAccessExpression = { kind: SyntaxKind.ElementAccessExpression, start, end, expression, argumentExpression};
		overrideParentInImmediateChildren(node);

		return node;
	}
	
	private parseCallExpression(expression: Expression): CallExpression {
		const start = expression.start;
		
		const { argumentExpressions, postCallInitialiser } = this.parseCallArguments();
		
		const end = this.lexer.lastToken.end;
		const node: CallExpression = { kind: SyntaxKind.CallExpression, start, end, expression, argumentExpressions, postCallInitialiser };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseStatement(): Statement {
		switch (this.token.kind) {
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
			return this.parseSwitchStatement();
		case SyntaxKind.LocalKeyword:
			return this.parseLocalStatement();
		case SyntaxKind.ConstKeyword:
			return this.parseConstStatement();
		case SyntaxKind.ReturnKeyword:
			return this.parseReturnStatement();
		case SyntaxKind.YieldKeyword:
			return this.parseYieldStatement();
		case SyntaxKind.ContinueKeyword:
			return this.parseContinueStatement();
		case SyntaxKind.BreakKeyword:
			return this.parseBreakStatement();
		case SyntaxKind.FunctionKeyword:
			return this.parseFunctionStatement();
		case SyntaxKind.ClassKeyword:
			return this.parseClassStatement();
		case SyntaxKind.EnumKeyword:
			return this.parseEnumStatement();
		case SyntaxKind.TryKeyword:
			return this.parseTryStatement();
		case SyntaxKind.ThrowKeyword:
			return this.parseThrowStatement();
		default:
			return this.parseExpressionStatement();
		}
	}

	private parseStatementWithEnd(): Statement {
		const statement = this.parseStatement();
		const kind = this.lexer.lastToken.kind;
		if (kind !== SyntaxKind.CloseBraceToken && kind !== SyntaxKind.SemicolonToken) {
			this.parseEndOfStatement();
		}
		return statement;
	}

	private parseEmptyStatement(): EmptyStatement {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.SemicolonToken);

		const end = this.lexer.lastToken.end;
		const node: EmptyStatement = { kind: SyntaxKind.EmptyStatement, start, end };

		return node;
	}

	private parseBlockStatement(): BlockStatement {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.OpenBraceToken);
		const statements = this.parseList(ParsingContext.BlockStatements, this.parseStatementWithEnd);
		this.parseExpected(SyntaxKind.CloseBraceToken);

		const end = this.lexer.lastToken.end;
		const node: BlockStatement = { kind: SyntaxKind.BlockStatement, start, end, statements };

		return node;
	}

	private parseIfStatement(): IfStatement {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.IfKeyword);
		this.parseExpected(SyntaxKind.OpenParenthesisToken);
		const expression = this.parseCommaExpression();
		this.parseExpected(SyntaxKind.CloseParenthesisToken);
		// The only place where you need to use parseStatementWithEnd. Why? Because it's a squirrel lang.
		const thenStatement = this.parseStatementWithEnd();
		const elseStatement = this.parseOptional(SyntaxKind.ElseKeyword) ? this.parseStatementWithEnd() : undefined;

		const end = this.lexer.lastToken.end;
		const node: IfStatement = { kind: SyntaxKind.IfStatement, start, end, expression, thenStatement, elseStatement };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseWhileStatement(): WhileStatement {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.WhileKeyword);
		this.parseExpected(SyntaxKind.OpenParenthesisToken);
		const expression = this.parseCommaExpression();
		this.parseExpected(SyntaxKind.CloseParenthesisToken);
		const statement = this.parseStatement();

		const end = this.lexer.lastToken.end;
		const node: WhileStatement = { kind: SyntaxKind.WhileStatement, start, end, expression, statement };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseDoStatement(): DoStatement {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.DoKeyword);
		const statement = this.parseStatement();
		this.parseExpected(SyntaxKind.WhileKeyword);
		this.parseExpected(SyntaxKind.OpenParenthesisToken);
		const expression = this.parseCommaExpression();

		const end = this.lexer.lastToken.end;
		const node: DoStatement = { kind: SyntaxKind.DoStatement, start, end, statement, expression };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseForStatement(): ForStatement {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.ForKeyword);
		this.parseExpected(SyntaxKind.OpenParenthesisToken);

		let initialiser: ForInitialiser | undefined;
		if (this.token.kind === SyntaxKind.LocalKeyword) {
			initialiser = this.parseLocalStatement();
		} else if (this.token.kind !== SyntaxKind.SemicolonToken) {
			initialiser = this.parseCommaExpression("Expression or ';' expected.");
		}

		this.parseExpected(SyntaxKind.SemicolonToken);
		const condition = this.token.kind !== SyntaxKind.SemicolonToken ? this.parseCommaExpression("Expression or ';' expected.") : undefined;
		this.parseExpected(SyntaxKind.SemicolonToken);
		const incrementor = this.token.kind !== SyntaxKind.CloseParenthesisToken ? this.parseCommaExpression("Expression or ')' expected.") : undefined;
		this.parseExpected(SyntaxKind.CloseParenthesisToken);
		const statement = this.parseStatement();

		const end = this.lexer.lastToken.end;
		const node: ForStatement = { kind: SyntaxKind.ForStatement, start, end, initialiser, condition, incrementor, statement };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseForEachStatement(): ForEachStatement {
		const start = this.token.start;
		this.parseExpected(SyntaxKind.ForEachKeyword);
		this.parseExpected(SyntaxKind.OpenParenthesisToken);
		let index: VariableDeclaration | undefined;
		let value = this.parseSimpleVariableDeclaration();
		if (this.parseOptional(SyntaxKind.CommaToken)) {
			index = value;
			value = this.parseSimpleVariableDeclaration();
		}
		this.parseExpected(SyntaxKind.InKeyword);
		const iterable = this.parseExpression();
		this.parseExpected(SyntaxKind.CloseParenthesisToken);
		const statement = this.parseStatement();

		const end = this.lexer.lastToken.end;
		const node: ForEachStatement = { kind: SyntaxKind.ForEachStatement, start, end, index, value, iterable, statement };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseSwitchStatement(): SwitchStatement {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.SwitchKeyword);
		this.parseExpected(SyntaxKind.OpenParenthesisToken);
		const expression = this.parseExpression();
		this.parseExpected(SyntaxKind.CloseParenthesisToken);
		const caseBlock = this.parseCaseBlock();

		const end = this.lexer.lastToken.end;
		const node: SwitchStatement = { kind: SyntaxKind.SwitchStatement, start, end, expression, caseBlock };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseCaseBlock(): CaseBlock {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.OpenBraceToken);
		const clauses = this.parseList(ParsingContext.SwitchClauses, this.parseCaseOrDefaultClause);
		this.parseExpected(SyntaxKind.CloseBraceToken);

		const end = this.lexer.lastToken.end;
		const node: CaseBlock = { kind: SyntaxKind.CaseBlock, start, end, clauses };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseCaseOrDefaultClause(): CaseClause | DefaultClause {
		if (this.token.kind === SyntaxKind.CaseKeyword) {
			return this.parseCaseClause();
		}

		return this.parseDefaultClause();
	}

	private parseCaseClause(): CaseClause {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.CaseKeyword);
		const expression = this.parseExpression();
		this.parseExpected(SyntaxKind.ColonToken);
		const statements = this.parseList(ParsingContext.SwitchClauseStatements, this.parseStatementWithEnd);

		const end = this.lexer.lastToken.end;
		const node: CaseClause = { kind: SyntaxKind.CaseClause, start, end, expression, statements };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseDefaultClause(): DefaultClause {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.DefaultKeyword);
		this.parseExpected(SyntaxKind.ColonToken);
		const statements = this.parseList(ParsingContext.SwitchClauseStatements, this.parseStatementWithEnd);

		const end = this.lexer.lastToken.end;
		const node: DefaultClause = { kind: SyntaxKind.DefaultClause, start, end, statements };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseLocalStatement(): LocalStatement | LocalFunctionDeclaration {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.LocalKeyword);

		if (this.parseOptional(SyntaxKind.FunctionKeyword)) {
			const name = this.parseIdentifierWithDiagnostic();
			const { environment, parameters } = this.parseFunctionEnvironmentAndParameters();
			const statement = this.parseStatement();

			const end = this.lexer.lastToken.end;
			const node: LocalFunctionDeclaration = { kind: SyntaxKind.LocalFunctionDeclaration, start, end, name, environment, parameters, statement };
			overrideParentInImmediateChildren(node);

			return node;
		}
		// Shouldn't be parsed with parseDelimitedList since it must contain at least 1 element and trailing commas are not allowed.
		const declarations = this.parseVariableDeclarations();
		
		const end = this.lexer.lastToken.end;
		const node: LocalStatement = { kind: SyntaxKind.LocalStatement, start, end, declarations };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseVariableDeclarations(): NodeArray<VariableDeclaration> {
		const start = this.token.start;

		const elements: VariableDeclaration[] = [this.parseVariableDeclaration("Identifier or 'function' expected.")];
		while (this.parseOptional(SyntaxKind.CommaToken)) {
			elements.push(this.parseVariableDeclaration());
		} 

		const end = this.lexer.lastToken.end;
		const node: NodeArray<VariableDeclaration> = { kind: SyntaxKind.NodeArray, start, end, elements };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseConstStatement(): ConstStatement {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.ConstKeyword);
		const name = this.parseIdentifierWithDiagnostic();
		const initialiser = this.parseInitialiser(SyntaxKind.EqualsToken);
		this.scalarLiteralErrors(initialiser);

		const end = this.lexer.lastToken.end;
		// Here is the only place where semicolon is parsed immediately. Why? Because it's a squirrel lang.
		this.parseEndOfStatement();
		const node: ConstStatement = { kind: SyntaxKind.ConstStatement, start, end, name, initialiser };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseReturnStatement(): ReturnStatement {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.ReturnKeyword);
		const expression = this.canParseEndOfStatement() ? undefined : this.parseCommaExpression();

		const end = this.lexer.lastToken.end;
		const node: ReturnStatement = { kind: SyntaxKind.ReturnStatement, start, end, expression };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseYieldStatement(): YieldStatement {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.YieldKeyword);
		const expression = this.canParseEndOfStatement() ? undefined : this.parseCommaExpression();

		const end = this.lexer.lastToken.end;
		const node: YieldStatement = { kind: SyntaxKind.YieldStatement, start, end, expression };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseContinueStatement(): ContinueStatement {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.ContinueKeyword);

		const end = this.lexer.lastToken.end;
		const node: ContinueStatement = { kind: SyntaxKind.ContinueStatement, start, end };

		return node;
	}

	private parseBreakStatement(): BreakStatement {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.BreakKeyword);

		const end = this.lexer.lastToken.end;
		const node: BreakStatement = { kind: SyntaxKind.BreakStatement, start, end };

		return node;
	}

	private parseFunctionStatement(): FunctionDeclaration {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.FunctionKeyword);
		let expression: Identifier | PropertyAccessExpression = this.parseIdentifierWithDiagnostic();
		while (this.parseOptional(SyntaxKind.ColonColonToken)) {
			const property = this.parseIdentifierWithDiagnostic();
			const end = this.lexer.lastToken.end;
			expression = { kind: SyntaxKind.PropertyAccessExpression, start, end, expression, property };
			overrideParentInImmediateChildren(expression);
		}
		const name: Identifier | ComputedName = expression.kind === SyntaxKind.Identifier ?
			expression :
			{ kind: SyntaxKind.ComputedName, start: expression.start, end: expression.end, expression };

		const { environment, parameters } = this.parseFunctionEnvironmentAndParameters();
		const statement = this.parseStatement();

		const end = this.lexer.lastToken.end;
		const node: FunctionDeclaration = { kind: SyntaxKind.FunctionDeclaration, start, end, name, environment, parameters, statement };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseClassStatement(): ClassDeclaration {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.ClassKeyword);
		const expression = this.parseUnaryExpressionOrHigher();
		if (!isValidSlotExpression(expression.kind)) {
			this.diagnostic("The class name must be a variable or a property access.", expression.start, expression.end);
		}
		const name: Identifier | ComputedName = expression.kind === SyntaxKind.Identifier ?
			expression as Identifier:
			{ kind: SyntaxKind.ComputedName, start: expression.start, end: expression.end, expression };
		
		const inherits = this.parseOptional(SyntaxKind.ExtendsKeyword) ? this.parseUnaryExpressionOrHigher() : undefined;
		const members = this.parseClassMembers();

		const end = this.lexer.lastToken.end;
		const node: ClassDeclaration = { kind: SyntaxKind.ClassDeclaration, start, end, name, inherits, members };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseClassMembers(): NodeArray<ClassMember> {
		if (!this.parseExpected(SyntaxKind.OpenBraceToken)) {
			return this.createMissingList<ClassMember>();
		}

		const members = this.parseDelimitedList(ParsingContext.ClassMembers, this.parseClassMember, SyntaxKind.SemicolonToken, /*isDelimiterOptional*/ true);
		this.parseExpected(SyntaxKind.CloseBraceToken);

		return members;
	}

	private parseClassMember(): ClassMember {
		const start = this.token.start;

		const isStatic = this.parseOptional(SyntaxKind.StaticKeyword);
		switch (this.token.kind) {
		case SyntaxKind.FunctionKeyword: {
			const { name, environment, parameters, statement } = this.parseMethod();

			const end = this.lexer.lastToken.end;
			const node: ClassMethod | ClassConstructor = name.value === "constructor" ?
				{ kind: SyntaxKind.ClassConstructor, start, end, isStatic, environment, parameters, statement, hasPrecedingFunction: true } :
				{ kind: SyntaxKind.ClassMethod, start, end, isStatic, name, environment, parameters, statement };
			overrideParentInImmediateChildren(node);

			return node;
		}
		case SyntaxKind.ConstructorKeyword: {
			const { environment, parameters, statement } = this.parseConstructor();

			const end = this.lexer.lastToken.end;
			const node: ClassConstructor = { kind: SyntaxKind.ClassConstructor, start, end, isStatic, environment, parameters, statement, hasPrecedingFunction: false };
			overrideParentInImmediateChildren(node);

			return node;
		}
		default: {
			const { name, initialiser } = this.parseProperty(AllowedPropertyName.Identifier | AllowedPropertyName.Computed, /*optionalInitialisation*/ false);

			const end = this.lexer.lastToken.end;
			const node: ClassPropertyAssignment = { kind: SyntaxKind.ClassPropertyAssignment, start, end, name, isStatic, initialiser };
			overrideParentInImmediateChildren(node);

			return node;
		}
		}
	}

	private parseEnumStatement(): EnumDeclaration {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.EnumKeyword);
		const name = this.parseIdentifierWithDiagnostic();
		const members = this.parseEnumMembers();

		const end = this.lexer.lastToken.end;
		const node: EnumDeclaration = { kind: SyntaxKind.EnumDeclaration, start, end, name, members };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseEnumMembers(): NodeArray<EnumMember> {
		if (!this.parseExpected(SyntaxKind.OpenBraceToken)) {
			return this.createMissingList<EnumMember>();
		}

		const members = this.parseDelimitedList(ParsingContext.EnumMembers, this.parseEnumMember, SyntaxKind.CommaToken, true);
		this.parseExpected(SyntaxKind.CloseBraceToken);

		return members;
	}

	private parseEnumMember(): EnumMember {
		const start = this.token.start;

		const { name, initialiser } = this.parseProperty(AllowedPropertyName.Identifier, /*optionalInitialisation*/ true);
		if (initialiser) {
			this.scalarLiteralErrors(initialiser);
		}

		const end = this.lexer.lastToken.end;
		const node: EnumMember = { kind: SyntaxKind.EnumMember, start, end, name, initialiser };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseTryStatement(): TryStatement {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.TryKeyword);
		const tryStatement = this.parseStatement();
		const catchClause = this.parseCatchClause();

		const end = this.token.end;
		const node: TryStatement = { kind: SyntaxKind.TryStatement, start, end, tryStatement, catchClause };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseCatchClause(): CatchClause {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.CatchKeyword);
		this.parseExpected(SyntaxKind.OpenParenthesisToken);
		const variable = this.parseSimpleVariableDeclaration();
		this.parseExpected(SyntaxKind.CloseParenthesisToken);
		const statement = this.parseStatement();

		const end = this.lexer.lastToken.end;
		const node: CatchClause = { kind: SyntaxKind.CatchClause, start, end, variable, statement };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseThrowStatement(): ThrowStatement {
		const start = this.token.start;

		this.parseExpected(SyntaxKind.ThrowKeyword);
		const expression = this.parseCommaExpression();

		const end = this.lexer.lastToken.end;
		const node: ThrowStatement = { kind: SyntaxKind.ThrowStatement, start, end, expression };
		overrideParentInImmediateChildren(node);

		return node;
	}

	private parseExpressionStatement(): ExpressionStatement {
		const start = this.token.start;

		const expression = this.parseCommaExpression("Statement expected.");

		const end = this.lexer.lastToken.end;
		const node: ExpressionStatement = { kind: SyntaxKind.ExpressionStatement, start, end, expression };
		overrideParentInImmediateChildren(node);

		return node;
	}
}