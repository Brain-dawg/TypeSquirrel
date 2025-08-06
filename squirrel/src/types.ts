import { Key } from "readline";
import { Lexer } from "./lexer";


export type Mutable<T extends object> = { -readonly [K in keyof T]: T[K]; };

export enum StringKind {
	INPUT,
	OUTPUT,
	TARGETNAME,
	CLASSNAME,
	// No division between float / bools / ints since they're interchangable
	NUMBER_KEYVALUE,
	VECTOR_KEYVALUE,
	STRING_KEYVALUE,
	ATTRIBUTE,
	MODEL,
	RAW_SOUND,
	SOUND_SCRIPT,
	PARTICLE,
	CONVAR,
	CLIENT_CONVAR,
	INT_PROPERTY,
	BOOL_PROPERTY,
	FLOAT_PROPERTY,
	STRING_PROPERTY,
	ENTITY_PROPERTY,
	VECTOR_PROPERTY,
	INT_ARRAY_PROPERTY,
	BOOL_ARRAY_PROPERTY,
	FLOAT_ARRAY_PROPERTY,
	STRING_ARRAY_PROPERTY,
	ENTITY_ARRAY_PROPERTY,
	VECTOR_ARRAY_PROPERTY,
	ARRAY_PROPERTY,
	PROPERTY,
	SOUND
}

export interface Doc {
	readonly detail: string;
	readonly desc?: string;
	readonly successor?: string;
	readonly append?: string;
	readonly snippet?: string;
	readonly [param: number]: StringKind | undefined;
};

export type Docs = Map<string, Doc>;

export type InstanceDocs = Map<string, Docs>;

export const enum SyntaxKind {
	Trivia = -2,
	Invalid = -1,
	EndOfFileToken = 0,

	BlockComment,
	DocComment,
	LineComment,

	AmpersandAmpersandToken,
	AmpersandToken,
	AsteriskEqualsToken,
	AsteriskToken,
	AtToken,
	CaretToken,
	CloseBraceToken,
	CloseBracketToken,
	CloseParenthesisToken,
	ColonColonToken,
	ColonToken,
	CommaToken,
	DotDotDotToken,
	DotToken,
	EqualsEqualsToken,
	EqualsToken,
	ExclamationToken,
	GreaterThanEqualsToken,
	GreaterThanGreaterThanGreaterThanToken,
	GreaterThanGreaterThanToken,
	GreaterThanToken,
	LessMinusToken,
	LessThanEqualsGreaterThanToken,
	LessThanEqualsToken,
	LessThanLessThanToken,
	LessThanSlashToken,
	LessThanToken,
	LineFeedToken,
	MinusEqualsToken,
	MinusMinusToken,
	MinusToken,
	ExclamationEqualsToken,
	OpenBraceToken,
	OpenBracketToken,
	OpenParenthesisToken,
	PercentEqualsToken,
	PercentToken,
	BarBarToken,
	BarToken,
	PlusEqualsToken,
	PlusPlusToken,
	PlusToken,
	QuestionToken,
	SemicolonToken,
	SlashEqualsToken,
	SlashGreaterThanToken,
	SlashToken,
	TildeToken,

	IdentifierToken,
	FloatToken,
	IntegerToken,
	StringToken,
	VerbatimStringToken,

	BaseKeyword,
	BreakKeyword,
	CaseKeyword,
	CatchKeyword,
	ClassKeyword,
	CloneKeyword,
	ConstKeyword,
	ConstructorKeyword,
	ContinueKeyword,
	DefaultKeyword,
	DeleteKeyword,
	DoKeyword,
	ElseKeyword,
	EnumKeyword,
	ExtendsKeyword,
	FalseKeyword,
	ForEachKeyword,
	ForKeyword,
	FunctionKeyword,
	IfKeyword,
	InKeyword,
	InstanceOfKeyword,
	LocalKeyword,
	NullKeyword,
	RawCallKeyword,
	ResumeKeyword,
	ReturnKeyword,
	StaticKeyword,
	SwitchKeyword,
	ThisKeyword,
	ThrowKeyword,
	TrueKeyword,
	TryKeyword,
	TypeOfKeyword,
	WhileKeyword,
	YieldKeyword,

	__FILE__Keyword,
	__LINE__Keyword,

	FirstKeyword = NullKeyword,
	LastKeyword = __LINE__Keyword,


	NodeArray,

	IfStatement,
	DoWhileStatement,
	WhileStatement,
	ForStatement,
	ForEachStatement,
	BreakStatement,
	ContinueStatement,
	YieldStatement,
	ReturnStatement,
	CaseClause,
	DefaultClause,
	SwitchStatement,
	TryStatement,
	CatchClause,
	ThrowStatement,

	Block,
	EmptyStatement,

	LocalStatement,
	VariableDeclarationList,
	VariableDeclaration,
	ConstStatement,

	FunctionDeclaration,
	ParameterDeclaration,

	ClassStatement,
	EnumStatement,


	ConditionalExpression,
	IntegerLiteral,
	FloatLiteral,
	StringLiteral,
	VerbatimStringLiteral,
	Identifier,
	BinaryExpression,
	PrefixUnaryExpression,
	PostfixUnaryExpression,
	NullLiteral,
	BooleanLiteralExpression,
	CommaListExpression,
	DeleteExpression,
	ResumeExpression,
	CloneExpression,
	FunctionExpression,
	LambdaExpression,
	TypeOfExpression,

	CallExpression,
	MemberAccessExpression,
	SubscriptExpression,


	ArrayLiteralExpression,
	TableLiteralExpression,

	ExpressionStatement,
	CaseBlock,
	ClassDeclaration,
	ClassExpression,

	EnumMember,
	EnumDeclaration,
	LocalFunctionDeclaration,
	MethodDeclaration,
	ConstructorDeclaration,
	ParenthesisedExpression,
};


export type Keyword =
	| SyntaxKind.WhileKeyword
	| SyntaxKind.DoKeyword
	| SyntaxKind.IfKeyword
	| SyntaxKind.ElseKeyword
	| SyntaxKind.BreakKeyword
	| SyntaxKind.ContinueKeyword
	| SyntaxKind.ReturnKeyword
	| SyntaxKind.NullKeyword
	| SyntaxKind.FunctionKeyword
	| SyntaxKind.LocalKeyword
	| SyntaxKind.ForKeyword
	| SyntaxKind.ForEachKeyword
	| SyntaxKind.InKeyword
	| SyntaxKind.TypeOfKeyword
	| SyntaxKind.BaseKeyword
	| SyntaxKind.DeleteKeyword
	| SyntaxKind.TryKeyword
	| SyntaxKind.CatchKeyword
	| SyntaxKind.ThrowKeyword
	| SyntaxKind.CloneKeyword
	| SyntaxKind.YieldKeyword
	| SyntaxKind.ResumeKeyword
	| SyntaxKind.SwitchKeyword
	| SyntaxKind.CaseKeyword
	| SyntaxKind.DefaultKeyword
	| SyntaxKind.ThisKeyword
	| SyntaxKind.ClassKeyword
	| SyntaxKind.ExtendsKeyword
	| SyntaxKind.ConstructorKeyword
	| SyntaxKind.InstanceOfKeyword
	| SyntaxKind.TrueKeyword
	| SyntaxKind.FalseKeyword
	| SyntaxKind.StaticKeyword
	| SyntaxKind.EnumKeyword
	| SyntaxKind.ConstKeyword
	| SyntaxKind.__LINE__Keyword
	| SyntaxKind.__FILE__Keyword
	| SyntaxKind.RawCallKeyword;

export type Comment =
	| SyntaxKind.LineComment
	| SyntaxKind.BlockComment
	| SyntaxKind.DocComment;

export type String =
	| SyntaxKind.StringToken
	| SyntaxKind.VerbatimStringToken;

export type Number =
	| SyntaxKind.IntegerToken
	| SyntaxKind.FloatToken

export type ValuedToken =
	| Comment
	| String
	| Number
	| Keyword
	| SyntaxKind.IdentifierToken;

export type ValidIdentifier =
	| SyntaxKind.IdentifierToken
	| SyntaxKind.ConstructorKeyword;

export const TokenToString = new Map<SyntaxKind, string>([
	[SyntaxKind.EndOfFileToken, 'EOF'],

	[SyntaxKind.AmpersandToken, '&'],
	[SyntaxKind.AsteriskEqualsToken, '*='],
	[SyntaxKind.AsteriskToken, '*'],
	[SyntaxKind.AtToken, '@'],
	[SyntaxKind.CaretToken, '^'],
	[SyntaxKind.CloseBraceToken, '}'],
	[SyntaxKind.CloseBracketToken, ']'],
	[SyntaxKind.CloseParenthesisToken, ')'],
	[SyntaxKind.ColonColonToken, '::'],
	[SyntaxKind.ColonToken, ':'],
	[SyntaxKind.CommaToken, ','],
	[SyntaxKind.DotDotDotToken, '...'],
	[SyntaxKind.DotToken, '.'],
	[SyntaxKind.EqualsEqualsToken, '=='],
	[SyntaxKind.EqualsToken, '='],
	[SyntaxKind.ExclamationToken, '!'],
	[SyntaxKind.GreaterThanEqualsToken, '>='],
	[SyntaxKind.GreaterThanGreaterThanGreaterThanToken, '>>>'],
	[SyntaxKind.GreaterThanGreaterThanToken, '>>'],
	[SyntaxKind.GreaterThanToken, '>'],
	[SyntaxKind.LessMinusToken, '<-'],
	[SyntaxKind.LessThanEqualsGreaterThanToken, '<=>'],
	[SyntaxKind.LessThanEqualsToken, '<='],
	[SyntaxKind.LessThanLessThanToken, '<<'],
	[SyntaxKind.LessThanSlashToken, '</'],
	[SyntaxKind.LessThanToken, '<'],
	[SyntaxKind.LineFeedToken, 'line feed'],
	[SyntaxKind.MinusEqualsToken, '-='],
	[SyntaxKind.MinusMinusToken, '--'],
	[SyntaxKind.MinusToken, '-'],
	[SyntaxKind.ExclamationEqualsToken, '!='],
	[SyntaxKind.OpenBraceToken, '{'],
	[SyntaxKind.OpenBracketToken, '['],
	[SyntaxKind.OpenParenthesisToken, '('],
	[SyntaxKind.PercentEqualsToken, '%='],
	[SyntaxKind.PercentToken, '%'],
	[SyntaxKind.BarBarToken, '||'],
	[SyntaxKind.BarToken, '|'],
	[SyntaxKind.PlusEqualsToken, '+='],
	[SyntaxKind.PlusPlusToken, '++'],
	[SyntaxKind.PlusToken, '+'],
	[SyntaxKind.QuestionToken, '?'],
	[SyntaxKind.SemicolonToken, ';'],
	[SyntaxKind.SlashEqualsToken, '/='],
	[SyntaxKind.SlashGreaterThanToken, '/>'],
	[SyntaxKind.SlashToken, '/'],
	[SyntaxKind.TildeToken, '~'],

	[SyntaxKind.FloatToken, 'float'],
	[SyntaxKind.IdentifierToken, 'identifier'],
	[SyntaxKind.IntegerToken, 'integer'],
	[SyntaxKind.StringToken, 'string'],
	[SyntaxKind.VerbatimStringToken, 'string'],

	[SyntaxKind.BaseKeyword, 'base'],
	[SyntaxKind.BreakKeyword, 'break'],
	[SyntaxKind.CaseKeyword, 'case'],
	[SyntaxKind.CatchKeyword, 'catch'],
	[SyntaxKind.ClassKeyword, 'class'],
	[SyntaxKind.CloneKeyword, 'clone'],
	[SyntaxKind.ConstKeyword, 'const'],
	[SyntaxKind.ConstructorKeyword, 'constructor'],
	[SyntaxKind.ContinueKeyword, 'continue'],
	[SyntaxKind.DefaultKeyword, 'default'],
	[SyntaxKind.DeleteKeyword, 'delete'],
	[SyntaxKind.DoKeyword, 'do'],
	[SyntaxKind.ElseKeyword, 'else'],
	[SyntaxKind.EnumKeyword, 'enum'],
	[SyntaxKind.ExtendsKeyword, 'extends'],
	[SyntaxKind.FalseKeyword, 'false'],
	[SyntaxKind.ForEachKeyword, 'foreach'],
	[SyntaxKind.ForKeyword, 'for'],
	[SyntaxKind.FunctionKeyword, 'function'],
	[SyntaxKind.IfKeyword, 'if'],
	[SyntaxKind.InKeyword, 'in'],
	[SyntaxKind.InstanceOfKeyword, 'instanceof'],
	[SyntaxKind.LocalKeyword, 'local'],
	[SyntaxKind.NullKeyword, 'null'],
	[SyntaxKind.RawCallKeyword, 'rawcall'],
	[SyntaxKind.ResumeKeyword, 'resume'],
	[SyntaxKind.ReturnKeyword, 'return'],
	[SyntaxKind.StaticKeyword, 'static'],
	[SyntaxKind.SwitchKeyword, 'switch'],
	[SyntaxKind.ThisKeyword, 'this'],
	[SyntaxKind.ThrowKeyword, 'throw'],
	[SyntaxKind.TrueKeyword, 'true'],
	[SyntaxKind.TryKeyword, 'try'],
	[SyntaxKind.TypeOfKeyword, 'typeof'],
	[SyntaxKind.WhileKeyword, 'while'],
	[SyntaxKind.YieldKeyword, 'yield'],

	[SyntaxKind.__FILE__Keyword, '__FILE__'],
	[SyntaxKind.__LINE__Keyword, '__LINE__'],
]);

export const ReservedKeywords = new Map<string, Keyword>([
	['while', SyntaxKind.WhileKeyword],
	['do', SyntaxKind.DoKeyword],
	['if', SyntaxKind.IfKeyword],
	['else', SyntaxKind.ElseKeyword],
	['break', SyntaxKind.BreakKeyword],
	['continue', SyntaxKind.ContinueKeyword],
	['return', SyntaxKind.ReturnKeyword],
	['null', SyntaxKind.NullKeyword],
	['function', SyntaxKind.FunctionKeyword],
	['local', SyntaxKind.LocalKeyword],
	['for', SyntaxKind.ForKeyword],
	['foreach', SyntaxKind.ForEachKeyword],
	['in', SyntaxKind.InKeyword],
	['typeof', SyntaxKind.TypeOfKeyword],
	['base', SyntaxKind.BaseKeyword],
	['delete', SyntaxKind.DeleteKeyword],
	['try', SyntaxKind.TryKeyword],
	['catch', SyntaxKind.CatchKeyword],
	['throw', SyntaxKind.ThrowKeyword],
	['clone', SyntaxKind.CloneKeyword],
	['yield', SyntaxKind.YieldKeyword],
	['resume', SyntaxKind.ResumeKeyword],
	['switch', SyntaxKind.SwitchKeyword],
	['case', SyntaxKind.CaseKeyword],
	['default', SyntaxKind.DefaultKeyword],
	['this', SyntaxKind.ThisKeyword],
	['class', SyntaxKind.ClassKeyword],
	['extends', SyntaxKind.ExtendsKeyword],
	['constructor', SyntaxKind.ConstructorKeyword],
	['instanceof', SyntaxKind.InstanceOfKeyword],
	['true', SyntaxKind.TrueKeyword],
	['false', SyntaxKind.FalseKeyword],
	['static', SyntaxKind.StaticKeyword],
	['enum', SyntaxKind.EnumKeyword],
	['const', SyntaxKind.ConstKeyword],
	['__LINE__', SyntaxKind.__LINE__Keyword],
	['__FILE__', SyntaxKind.__FILE__Keyword],
	['rawcall', SyntaxKind.RawCallKeyword]
]);

export function isTokenAKeyword(token: Token<SyntaxKind>): token is Token<Keyword> {
	return token.kind >= SyntaxKind.FirstKeyword && token.kind <= SyntaxKind.LastKeyword;
}

export function isTokenAValidIdentifier(token: Token<SyntaxKind>): token is Token<ValidIdentifier> {
	const kind = token.kind;
	return kind === SyntaxKind.Identifier || kind === SyntaxKind.ConstructorKeyword;
}

export function isTokenAComment(token: Token<SyntaxKind>): token is Token<Comment> {
	const kind = token.kind;
	return kind === SyntaxKind.LineComment || kind === SyntaxKind.BlockComment || kind === SyntaxKind.DocComment;
}

export function isTokenTrivia(token: Token<SyntaxKind>): token is Token<Comment | SyntaxKind.LineFeedToken> {
	return isTokenAComment(token) || token.kind === SyntaxKind.LineFeedToken;
}

export function isTokenAString(token: Token<SyntaxKind>): token is StringToken<String> {
	const kind = token.kind;
	return kind === SyntaxKind.StringToken || kind === SyntaxKind.VerbatimStringToken;
}

export interface ReadonlyTextRange {
	readonly start: number;
	readonly end: number;
}

export const enum DiagnosticSeverity {
	Error = 1,
	Warning = 2
}

export interface VScriptDiagnostic extends ReadonlyTextRange {
	readonly message: string;
	readonly severity: DiagnosticSeverity;
}


export interface Token<TKind extends SyntaxKind> extends ReadonlyTextRange {
	readonly kind: TKind;
	readonly doc?: Token<SyntaxKind.DocComment>;
	readonly value: TKind extends ValuedToken ? string : undefined;
}

export interface MissingToken<TKind extends SyntaxKind> extends Token<TKind> {
	readonly isMissing: true;
	readonly value: TKind extends ValuedToken ? string : undefined;
}

export interface StringToken<TKind extends SyntaxKind.StringToken | SyntaxKind.VerbatimStringToken>
	extends Token<SyntaxKind.StringToken | SyntaxKind.VerbatimStringToken> {
	readonly kind: TKind;
	readonly sourcePositions: number[];
	lexer?: Lexer;
}


export const enum SymbolFlags {
	None = 0,
	Global = 1 << 0,
	FunctionScopedVariable = 1 << 1,  // Parameter
	BlockScopedVariable = 1 << 2,  // A block-scoped variable (local)
	Property = 1 << 3,  // Property or enum member
	EnumMember = 1 << 4,  // Enum member
	Function = 1 << 5,  // Function
	Class = 1 << 6,  // Class
	Enum = 1 << 7,  // Enum
	Method = 1 << 8,  // Method
	Constructor = 1 << 9,  // Constructor
	All = -1
}

export type SymbolTable = Map<string, Symbol>;

export interface Symbol {
	flags: SymbolFlags;
	name: string;
	declarations?: NodeArray<Declaration>;
	valueDeclaration?: Declaration;
	members?: SymbolTable;
	parent?: Symbol;
}

export interface Node extends ReadonlyTextRange {
	readonly kind: SyntaxKind;
	parent?: Node;
}

export interface NodeArray<T extends Node> extends Node {
	readonly kind: SyntaxKind.NodeArray;
	readonly elements: T[];
}

export interface TokenNode<TKind extends SyntaxKind> extends Node {
	readonly kind: TKind;
	readonly doc?: Token<SyntaxKind.DocComment>;
	readonly value?: string;
}

export interface Declaration extends Node {
	symbol?: Symbol;
}

export type PropertyName =
	| Identifier
	| StringLiteral
	| NumericLiteral;

export interface ExpressionDeclaration extends Declaration {
	readonly name: Expression;
	readonly escaped: string;
}

export interface NamedDeclaration extends Declaration {
	readonly name: PropertyName;
}

export interface LocalsContainer extends Node {
	locals?: SymbolTable;
}

export interface Statement extends Node { }

export interface EmptyStatement extends Node {
	readonly kind: SyntaxKind.EmptyStatement;
}

export interface Block extends Statement {
	readonly kind: SyntaxKind.Block;
	readonly body: NodeArray<Statement>;
}

export interface ExpressionStatement extends Statement {
	readonly kind: SyntaxKind.ExpressionStatement;
	readonly expression: Expression;
}

export interface ConstStatement extends Statement, NamedDeclaration {
	readonly kind: SyntaxKind.ConstStatement;
	readonly name: Identifier;
	readonly initialiser: ScalarLiteralExpression;
}

export interface LocalStatement extends Statement {
	readonly kind: SyntaxKind.LocalStatement;
	readonly declarationList: NodeArray<VariableDeclaration>;
}

export interface VariableDeclaration extends NamedDeclaration, Node {
	readonly kind: SyntaxKind.VariableDeclaration;
	readonly name: Identifier;
	readonly initialiser?: Expression;
};


export interface IfStatement extends Statement {
	readonly kind: SyntaxKind.IfStatement;
	readonly expression: Expression;
	readonly thenStatement: Statement;
	readonly elseStatement?: Statement;
}

export interface IterationStatement extends Statement {
	readonly statement: Statement;
}

export interface DoStatement extends IterationStatement {
	readonly kind: SyntaxKind.DoWhileStatement;
	readonly expression: Expression;
}

export interface WhileStatement extends IterationStatement {
	readonly kind: SyntaxKind.WhileStatement;
	readonly expression: Expression;
}

export type ForInitialiser =
	| LocalStatement
	| Expression;

export interface ForStatement extends LocalsContainer, IterationStatement {
	readonly kind: SyntaxKind.ForStatement;
	readonly initialiser?: ForInitialiser;
	readonly condition?: Expression;
	readonly incrementor?: Expression;
}

export interface ForEachStatement extends LocalsContainer, IterationStatement {
	readonly kind: SyntaxKind.ForEachStatement;
	readonly index?: VariableDeclaration;
	readonly value: VariableDeclaration;
	readonly iterable: Expression;
}

export interface BreakStatement extends Statement {
	readonly kind: SyntaxKind.BreakStatement;
}

export interface ContinueStatement extends Statement {
	readonly kind: SyntaxKind.ContinueStatement;
}

export type BreakOrContinueStatement =
	| BreakStatement
	| ContinueStatement;

export interface ReturnStatement extends Statement {
	readonly kind: SyntaxKind.ReturnStatement;
	readonly expression?: Expression;
}

export interface YieldStatement extends Statement {
	readonly kind: SyntaxKind.YieldStatement;
	readonly expression?: Expression;
}

export interface SwitchStatement extends Statement {
	readonly kind: SyntaxKind.SwitchStatement;
	readonly expression: Expression;
	readonly caseBlock: CaseBlock;
}

export type CaseOrDefaultClause =
	| CaseClause
	| DefaultClause;

export interface CaseBlock extends Node, LocalsContainer {
	readonly kind: SyntaxKind.CaseBlock;
	readonly parent: SwitchStatement;
	readonly clauses: NodeArray<CaseOrDefaultClause>;
}

export interface CaseClause extends Statement {
	readonly kind: SyntaxKind.CaseClause;
	readonly expression: Expression;
	readonly statements: NodeArray<Statement>;
	// fallthrough?: CaseOrDefaultClause
}

export interface DefaultClause extends Statement {
	readonly kind: SyntaxKind.DefaultClause;
	readonly statements: NodeArray<Statement>;
	// fallthrough?: CaseOrDefaultClause
}

export interface ThrowStatement extends Statement {
	readonly kind: SyntaxKind.ThrowStatement;
	readonly expression: Expression;
}

export interface TryStatement extends Statement {
	readonly kind: SyntaxKind.TryStatement;
	readonly tryBlock: Statement;
	readonly catchClause: CatchClause;
}

export interface CatchClause extends Node, LocalsContainer {
	readonly kind: SyntaxKind.CatchClause;
	readonly parent: TryStatement;
	readonly variable: VariableDeclaration;
	readonly block: Statement;
}

export type ClassElement = NamedDeclaration;

export interface ClassLikeDeclarationBase extends ExpressionDeclaration {
	readonly kind: SyntaxKind.ClassDeclaration | SyntaxKind.ClassExpression;
	// extends ::a.b.c.d {}
	readonly extends?: Expression;
	readonly members: NodeArray<ClassElement>;
}

export interface ClassDeclaration extends ClassLikeDeclarationBase {
	readonly kind: SyntaxKind.ClassDeclaration;
	// class ::a.b.c.d {}
	readonly name: Expression;
}

export interface ClassExpression extends ClassLikeDeclarationBase {
	readonly kind: SyntaxKind.ClassExpression;
}

export type ClassLikeDeclaration = ClassDeclaration | ClassExpression;

export interface EnumMember extends NamedDeclaration {
	readonly kind: SyntaxKind.EnumMember;
	readonly parent: EnumDeclaration;
	readonly name: PropertyName;
	readonly initializer: ScalarLiteralExpression;
}

export interface EnumDeclaration extends NamedDeclaration {
	readonly kind: SyntaxKind.EnumDeclaration;
	readonly name: Identifier;
}

export interface ParameterDeclaration extends NamedDeclaration {
	readonly kind: SyntaxKind.ParameterDeclaration;
	readonly name: Identifier;
	readonly initialiser?: Expression;
}

export interface FunctionLikeDeclarationBase extends Node {
	readonly parameters: NodeArray<ParameterDeclaration>;
	readonly ellipsis?: TokenNode<SyntaxKind.DotDotDotToken>;
}

export interface FunctionDeclaration extends FunctionLikeDeclarationBase, ExpressionDeclaration, LocalsContainer {
	readonly kind: SyntaxKind.FunctionDeclaration;
	// function a::b::c::d() {}
	readonly statement: Statement;
}

export interface LocalFunctionDeclaration extends FunctionLikeDeclarationBase, NamedDeclaration, LocalsContainer {
	readonly kind: SyntaxKind.LocalFunctionDeclaration;
	readonly name: Identifier;
	readonly statement: Statement;
}

export interface MethodDeclaration extends FunctionLikeDeclarationBase, NamedDeclaration, LocalsContainer {
	readonly kind: SyntaxKind.MethodDeclaration;
	readonly parent: ClassLikeDeclaration | TableLiteralExpression;
	readonly name: Identifier;
	readonly statement: Statement;
}

export interface ConstructorDeclaration extends FunctionLikeDeclarationBase, LocalsContainer {
	readonly kind: SyntaxKind.ConstructorDeclaration;
	readonly parent: ClassLikeDeclaration;
	// function constructor() {} | constructor() {} both work
	readonly functionToken?: TokenNode<SyntaxKind.FunctionKeyword>;
	readonly statement: Statement;
}

export interface FunctionExpression extends FunctionLikeDeclarationBase {
	readonly kind: SyntaxKind.FunctionExpression;
	readonly statement: Statement;
}

export interface LambdaExpression extends FunctionLikeDeclarationBase {
	readonly kind: SyntaxKind.LambdaExpression;
	readonly expression: Expression;
}



export const enum OperatorPrecedence {
	Comma, // `,`
	AssignmentOrConditional, // `?`, `=`, `+=`, `-=`, `/=`, `*=`, `%=`, `<-`
	LogicalOR,  // `||`
	LogicalAND, // `&&`
	BitwiseOR, // `|`
	BitwiseXOR, // `^`
	BitwiseAND, // `&`
	Equality, // `==`, `!=`, `<=>`
	Relational, // `<`, `>`, `<=`, `>=`, `instanceof`, `in`
	Shift, // `<<`, `>>`, `>>>`
	Additive, // `+`, `-`
	Multiplicative, // `*`, `/`, `%`

	Invalid = 1,
}

export const enum OperatorAssociativity {
	None,
	Left,
	Right,
}

export function getBinaryOperatorPrecedence(kind: SyntaxKind): OperatorPrecedence {
	switch (kind) {
	case SyntaxKind.CommaToken:
		return OperatorPrecedence.Comma;
	case SyntaxKind.EqualsToken:
	case SyntaxKind.PlusEqualsToken:
	case SyntaxKind.MinusEqualsToken:
	case SyntaxKind.AsteriskEqualsToken:
	case SyntaxKind.SlashEqualsToken:
	case SyntaxKind.PercentEqualsToken:
	case SyntaxKind.LessMinusToken:
	case SyntaxKind.QuestionToken:
		return OperatorPrecedence.AssignmentOrConditional;
	case SyntaxKind.BarBarToken:
		return OperatorPrecedence.LogicalOR;
	case SyntaxKind.AmpersandAmpersandToken:
		return OperatorPrecedence.LogicalAND;
	case SyntaxKind.BarToken:
		return OperatorPrecedence.BitwiseOR;
	case SyntaxKind.CaretToken:
		return OperatorPrecedence.BitwiseXOR;
	case SyntaxKind.AmpersandToken:
		return OperatorPrecedence.BitwiseAND;
	case SyntaxKind.EqualsEqualsToken:
	case SyntaxKind.ExclamationEqualsToken:
	case SyntaxKind.LessThanEqualsGreaterThanToken:
        return OperatorPrecedence.Equality;
	case SyntaxKind.LessThanToken:
	case SyntaxKind.GreaterThanToken:
	case SyntaxKind.LessThanEqualsToken:
	case SyntaxKind.GreaterThanEqualsToken:
	case SyntaxKind.InstanceOfKeyword:
	case SyntaxKind.InKeyword:
		return OperatorPrecedence.Relational;
	case SyntaxKind.LessThanLessThanToken:
	case SyntaxKind.GreaterThanGreaterThanToken:
	case SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
		return OperatorPrecedence.Shift;
	case SyntaxKind.PlusToken:
	case SyntaxKind.MinusToken:
		return OperatorPrecedence.Additive;
	case SyntaxKind.AsteriskToken:
	case SyntaxKind.SlashToken:
	case SyntaxKind.PercentToken:
		return OperatorPrecedence.Multiplicative;
	}

	// -1 is lower than all other precedences.  Returning it will cause binary expression
	// parsing to stop.
	return OperatorPrecedence.Invalid;
}

export interface Expression extends Node {

}

export interface UnaryExpression extends Expression {

}
export interface PrimaryExpression extends Expression {

}

export interface ParenthesisedExpression extends PrimaryExpression {
	readonly kind: SyntaxKind.ParenthesisedExpression;
	readonly expression: Expression;
}


export interface ThisExpression extends PrimaryExpression {
	readonly kind: SyntaxKind.ThisKeyword;
}

export interface BaseExpression extends PrimaryExpression {
	readonly kind: SyntaxKind.BaseKeyword;
}

export interface DeleteExpression extends UnaryExpression {
	readonly kind: SyntaxKind.DeleteExpression;
	readonly expression: UnaryExpression;
}

export interface ResumeExpression extends UnaryExpression {
	readonly kind: SyntaxKind.ResumeExpression;
	readonly expression: UnaryExpression;
}

export interface TypeOfExpression extends UnaryExpression {
	readonly kind: SyntaxKind.TypeOfExpression;
	readonly expression: UnaryExpression;
}

export interface CloneExpression extends UnaryExpression {
	readonly kind: SyntaxKind.CloneExpression;
	readonly expression: UnaryExpression;
}


export interface LiteralExpression {
	readonly value: string;
}

export interface NumericLiteral extends PrimaryExpression, LiteralExpression {
	readonly kind: SyntaxKind.IntegerLiteral | SyntaxKind.FloatLiteral;
}

export interface StringLiteral extends PrimaryExpression, LiteralExpression {
	readonly kind: SyntaxKind.StringLiteral | SyntaxKind.VerbatimStringLiteral;
}

export interface Identifier extends PrimaryExpression, LiteralExpression {
	readonly kind: SyntaxKind.Identifier;
}


export interface NullLiteral extends PrimaryExpression {
	readonly kind: SyntaxKind.NullKeyword;
}

export interface TrueLiteral extends PrimaryExpression {
	readonly kind: SyntaxKind.TrueKeyword;
}

export interface FalseLiteral extends PrimaryExpression {
	readonly kind: SyntaxKind.FalseKeyword;
}

export type BooleanLiteral = TrueLiteral | FalseLiteral;

export type ScalarLiteralExpression =
	| NumericLiteral
	| StringLiteral
	| BooleanLiteral;


export type PostfixUnaryOperator =
	| SyntaxKind.PlusPlusToken
	| SyntaxKind.MinusMinusToken;

export interface PostfixUnaryExpression extends UnaryExpression {
	readonly kind: SyntaxKind.PostfixUnaryExpression;
	readonly operand: Expression;
	readonly operator: TokenNode<PostfixUnaryOperator>;
}

export type PrefixUnaryOperator =
	| SyntaxKind.PlusPlusToken
	| SyntaxKind.MinusMinusToken
	| SyntaxKind.PlusToken
	| SyntaxKind.MinusToken
	| SyntaxKind.TildeToken
	| SyntaxKind.ExclamationToken
	| SyntaxKind.ColonColonToken;

export interface PrefixUnaryExpression extends UnaryExpression {
	readonly kind: SyntaxKind.PrefixUnaryExpression;
	readonly operator: TokenNode<PrefixUnaryOperator>;
	readonly operand: UnaryExpression;
}

export interface BinaryExpression extends Expression {
	readonly kind: SyntaxKind.BinaryExpression;
	readonly left: Expression;
	readonly right: Expression;
	readonly operator: TokenNode<SyntaxKind>;
}


export interface ConditionalExpression extends Expression {
	readonly kind: SyntaxKind.ConditionalExpression;
	readonly condition: Expression;
	readonly whenTrue: Expression;
	// whenFalse is not allowed to be undefined by default, but since the user can skip writing a `:` that could usually be the case
	readonly whenFalse?: Expression;
}

export interface MemberAccessExpression extends Expression {
	readonly kind: SyntaxKind.MemberAccessExpression;
	readonly member: Identifier;
}

export interface SubscriptExpression extends Expression {
	readonly kind: SyntaxKind.SubscriptExpression;
	readonly expression: Expression;
}

export interface CallExpression extends Expression {
	readonly kind: SyntaxKind.CallExpression;
	readonly expression: Expression;
	readonly arguments: NodeArray<Expression>;
}


export interface ArrayLiteralExpression extends PrimaryExpression {
	readonly kind: SyntaxKind.ArrayLiteralExpression,
	readonly elements: NodeArray<Expression>
}

export interface TableLiteralExpression extends PrimaryExpression {
	readonly kind: SyntaxKind.TableLiteralExpression,
	readonly elements: {
		[name: string]: Expression
	}
}
