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

	AsteriskEqualsToken,
	EqualsToken,
	MinusEqualsToken,
	PercentEqualsToken,
	PlusEqualsToken,
	SlashEqualsToken,
	LessMinusToken,

	PlusToken,
	MinusToken,
	AsteriskToken,
	SlashToken,
	PercentToken,
	AmpersandToken,
	BarToken,
	CaretToken,
	AmpersandAmpersandToken,
	BarBarToken,
	LessThanToken,
	GreaterThanToken,
	LessThanEqualsToken,
	GreaterThanEqualsToken,
	EqualsEqualsToken,
	ExclamationEqualsToken,
	LessThanLessThanToken,
	GreaterThanGreaterThanToken,
	GreaterThanGreaterThanGreaterThanToken,
	LessThanEqualsGreaterThanToken,

	ExclamationToken,
	TildeToken,
	PlusPlusToken,
	MinusMinusToken,

	AtToken,
	ColonToken,
	ColonColonToken,
	CommaToken,
	SemicolonToken,
	DotToken,
	DotDotDotToken,
	QuestionToken,
	LineFeedToken,

	OpenBraceToken,
	CloseBraceToken,
	OpenBracketToken,
	CloseBracketToken,
	OpenParenthesisToken,
	CloseParenthesisToken,
	LessThanSlashToken,
	SlashGreaterThanToken,

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

	NodeArray,
	BlockStatement,
	EmptyStatement,
	ExpressionStatement,

	IfStatement,
	WhileStatement,
	DoStatement,
	ForStatement,
	ForEachStatement,
	SwitchStatement,
	CaseClause,
	DefaultClause,
	CaseBlock,
	TryStatement,
	CatchClause,
	
	BreakStatement,
	ContinueStatement,
	ReturnStatement,
	YieldStatement,
	ThrowStatement,

	LocalStatement,
	VariableDeclaration,
	ParameterDeclaration,
	ConstStatement,
	FunctionDeclaration,
	LocalFunctionDeclaration,
	ClassDeclaration,
	ClassExpression,
	EnumStatement,
	EnumDeclaration,
	EnumMember,

	TrueLiteral,
	FalseLiteral,
	NullLiteral,
	ThisExpression,
	BaseExpression,
	IntegerLiteral,
	FloatLiteral,
	StringLiteral,
	VerbatimStringLiteral,
	Identifier,
	VariedArgs,

	ComputedName,
	BinaryExpression,
	ConditionalExpression,
	PrefixUnaryExpression,
	PostfixUnaryExpression,
	ParenthesisedExpression,

	CallExpression,
	PropertyAccessExpression,
	ElementAccessExpression,
	RootAccessExpression,

	DeleteExpression,
	ResumeExpression,
	CloneExpression,
	TypeOfExpression,
	RawCallExpression,
	FunctionExpression,
	LambdaExpression,


	ArrayLiteralExpression,
	TableLiteralExpression,

	TablePropertyAssignment,
	TableMethod,
	TableConstructor,

	ClassPropertyAssignment,
	ClassMethod,
	ClassConstructor,

	PostCallInitialiser,
	PostCallInitialiserPropertyAssignment,

	FileExpression,
	LineExpression,
	
	SourceFile,
	
	FirstKeyword = BaseKeyword,
	LastKeyword = __LINE__Keyword,
	FirstAssignment = AsteriskEqualsToken,
	LastAssignment = LessMinusToken
};


export type KeywordTokenKind =
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

export type CommentTokenKind =
	| SyntaxKind.LineComment
	| SyntaxKind.BlockComment
	| SyntaxKind.DocComment;

export type StringTokenKind =
	| SyntaxKind.StringToken
	| SyntaxKind.VerbatimStringToken;

export type NumberTokenKind =
	| SyntaxKind.IntegerToken
	| SyntaxKind.FloatToken

export type ValuedTokenKind =
	| CommentTokenKind
	| StringTokenKind
	| NumberTokenKind
	| KeywordTokenKind
	| SyntaxKind.IdentifierToken;

export type ValidIdentifierTokenKind =
	| SyntaxKind.IdentifierToken
	| SyntaxKind.ConstructorKeyword;

export type AssignmentOperator =
	| SyntaxKind.EqualsToken
	| SyntaxKind.EqualsToken
	| SyntaxKind.MinusEqualsToken
	| SyntaxKind.PercentEqualsToken
	| SyntaxKind.PlusEqualsToken
	| SyntaxKind.SlashEqualsToken
	| SyntaxKind.LessMinusToken;

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

export const ReservedKeywords = new Map<string, KeywordTokenKind>([
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

export function isTokenAKeyword(token: Token<SyntaxKind>): token is Token<KeywordTokenKind> {
	return token.kind >= SyntaxKind.FirstKeyword && token.kind <= SyntaxKind.LastKeyword;
}

export function isTokenAValidIdentifier(token: Token<SyntaxKind>): token is Token<ValidIdentifierTokenKind> {
	return token.kind === SyntaxKind.IdentifierToken || token.kind === SyntaxKind.ConstructorKeyword;
}

export function isTokenAComment(token: Token<SyntaxKind>): token is Token<CommentTokenKind> {
	return token.kind === SyntaxKind.LineComment || token.kind === SyntaxKind.BlockComment || token.kind === SyntaxKind.DocComment;
}

export function isTokenTrivia(token: Token<SyntaxKind>): token is Token<CommentTokenKind | SyntaxKind.LineFeedToken> {
	return isTokenAComment(token) || token.kind === SyntaxKind.LineFeedToken;
}

export function isTokenAString(token: Token<SyntaxKind>): token is StringToken<StringTokenKind> {
	return token.kind === SyntaxKind.StringToken || token.kind === SyntaxKind.VerbatimStringToken;
}

export function isAssignmentOperator(token: Token<SyntaxKind>): token is Token<AssignmentOperator> {
	return token.kind >= SyntaxKind.FirstAssignment && token.kind <= SyntaxKind.LastAssignment;
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
	readonly value: TKind extends ValuedTokenKind ? string : undefined;
	doc?: Token<SyntaxKind.DocComment>;
}

export interface MissingToken<TKind extends SyntaxKind> extends Token<TKind> {
	readonly isMissing: true;
	readonly value: TKind extends ValuedTokenKind ? string : undefined;
}

export interface StringToken<TKind extends StringTokenKind>
	extends Token<StringTokenKind> {
	readonly kind: TKind;
	readonly sourcePositions: number[];
	lexer?: Lexer;
}


export const enum SymbolFlags {
	None = 0,
	Global                 = 1 << 0,
	FunctionScopedVariable = 1 << 1,  // Parameter
	BlockScopedVariable    = 1 << 2,  // A block-scoped variable (local)
	Property               = 1 << 3,  // Property
	EnumMember             = 1 << 4,  // Enum member
	Function               = 1 << 5,  // Function
	Class                  = 1 << 6,  // Class
	Enum                   = 1 << 7,  // Enum
	TableLiteral           = 1 << 8,  // Table Literal
	Method                 = 1 << 9,  // Method
	Constructor            = 1 << 10, // Constructor
	NewSlot                = 1 << 11, // Assignment treated as declaration (eg `this.prop <- 1`)
	
	Variable = FunctionScopedVariable | BlockScopedVariable,

	All = -1
}

export type SymbolTable = Map<string, Symbol>;

export interface Symbol {
	flags: SymbolFlags;
	name: string;
	declaration?: Declaration;
	members?: SymbolTable;
	parent?: Symbol;
}

export interface LocalsContainer extends Node {
	locals?: SymbolTable;
}

// [identifier] = ...
// looks the same as
// identifier = ...
// without this intermediate interface
export interface ComputedName extends Node {
    readonly kind: SyntaxKind.ComputedName;
    parent?: Declaration;
    readonly expression: Expression;
}


export type Name =
	| Identifier
	| StringLiteral
	| VerbatimStringLiteral
	| ComputedName;

export interface Declaration extends Node {
	symbol?: Symbol;
}

export interface NamedDeclaration extends Declaration {
	readonly name: Name;
}


export interface Node extends ReadonlyTextRange {
	readonly kind: SyntaxKind;
	parent?: Node;
}

export interface NodeArray<T extends Node> extends Node {
	readonly kind: SyntaxKind.NodeArray;
	readonly elements: T[];
}

export interface SourceFile extends Node, LocalsContainer {
	readonly kind: SyntaxKind.SourceFile;
	readonly statements: NodeArray<Statement>;
}


export interface Statement extends Node { }

export interface EmptyStatement extends Node {
	readonly kind: SyntaxKind.EmptyStatement;
}

export interface BlockStatement extends Statement, LocalsContainer {
	readonly kind: SyntaxKind.BlockStatement;
	readonly statements: NodeArray<Statement>;
}

export interface ExpressionStatement extends Statement {
	readonly kind: SyntaxKind.ExpressionStatement;
	readonly expression: Expression;
}

export interface ConstStatement extends Statement, NamedDeclaration {
	readonly kind: SyntaxKind.ConstStatement;
	readonly name: Identifier;
	readonly initialiser: Expression; //ScalarLiteralExpression;
}

export interface LocalStatement extends Statement {
	readonly kind: SyntaxKind.LocalStatement;
	readonly declarations: NodeArray<VariableDeclaration>;
}

export interface VariableDeclaration extends NamedDeclaration {
	readonly kind: SyntaxKind.VariableDeclaration;
	readonly name: Identifier;
	readonly initialiser?: Expression;
}


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
	readonly kind: SyntaxKind.DoStatement;
	readonly expression: Expression;
}

export interface WhileStatement extends IterationStatement {
	readonly kind: SyntaxKind.WhileStatement;
	readonly expression: Expression;
}

export type ForInitialiser =
	| LocalStatement
	| LocalFunctionDeclaration
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
	parent?: SwitchStatement;
	readonly clauses: NodeArray<CaseOrDefaultClause>;
}

export interface CaseClause extends Statement {
	readonly kind: SyntaxKind.CaseClause;
	readonly expression: Expression;
	readonly statements: NodeArray<Statement>;
	// fallthrough?: CaseOrDefaultClause;
}

export interface DefaultClause extends Statement {
	readonly kind: SyntaxKind.DefaultClause;
	readonly statements: NodeArray<Statement>;
	// fallthrough?: CaseOrDefaultClause;
}

export interface ThrowStatement extends Statement {
	readonly kind: SyntaxKind.ThrowStatement;
	readonly expression: Expression;
}

export interface TryStatement extends Statement {
	readonly kind: SyntaxKind.TryStatement;
	readonly tryStatement: Statement;
	readonly catchClause: CatchClause;
}

export interface CatchClause extends Node, LocalsContainer {
	readonly kind: SyntaxKind.CatchClause;
	parent?: TryStatement;
	readonly variable: VariableDeclaration;
	readonly statement: Statement;
}


export interface ClassLikeDeclarationBase extends Declaration {
	readonly kind: SyntaxKind.ClassDeclaration | SyntaxKind.ClassExpression;
	// extends ::a.b.c.d {}
	readonly inherits?: Expression;
	readonly members: NodeArray<ClassMember>;
}

export interface ClassDeclaration extends ClassLikeDeclarationBase, NamedDeclaration {
	readonly name: Identifier | ComputedName;
	readonly kind: SyntaxKind.ClassDeclaration;
}

export interface ClassExpression extends ClassLikeDeclarationBase {
	readonly kind: SyntaxKind.ClassExpression;
}

export interface ClassMember extends Declaration {
	readonly isStatic: boolean;
}

export interface ClassPropertyAssignment extends ClassMember, PropertyAssignmentBase {
	readonly kind: SyntaxKind.ClassPropertyAssignment;
	parent?: ClassLikeDeclarationBase;
	// To make this more error tolerant string names are also allowed
	// readonly name: Identifier | Expression;
	readonly initialiser: Expression;
}

export interface ClassMethod extends ClassMember, MethodDeclarationBase {
	readonly kind: SyntaxKind.ClassMethod;
	parent?: ClassLikeDeclarationBase;
}

export interface ClassConstructor extends ClassMember, ConstructorDeclarationBase {
	readonly kind: SyntaxKind.ClassConstructor;
	parent?: ClassLikeDeclarationBase;
}


export interface EnumDeclaration extends NamedDeclaration {
	readonly kind: SyntaxKind.EnumDeclaration;
	readonly name: Identifier;
	readonly members: NodeArray<EnumMember>;
}


export interface EnumMember extends PropertyAssignmentBase {
	readonly kind: SyntaxKind.EnumMember;
	parent?: EnumDeclaration;
	// Only the identifiers are allowed, but to make this more error tolerant other property names are also allowed
	// readonly name: Identifier;
	// readonly initialiser?: ScalarLiteralExpression;
}


export interface FunctionLikeDeclarationBase extends Declaration, LocalsContainer {
	readonly environment?: Expression;
	readonly parameters: NodeArray<Parameter>;
}

// The only exception is a lambda expression
export interface StatementFunctionBase extends FunctionLikeDeclarationBase {
	readonly statement: Statement;
}

export interface VariedArgs extends Node {
	readonly kind: SyntaxKind.VariedArgs;
}

export interface ParameterDeclaration extends NamedDeclaration {
	readonly kind: SyntaxKind.ParameterDeclaration;
	readonly name: Identifier;
	readonly initialiser?: Expression;
}

export type Parameter = ParameterDeclaration | VariedArgs;

export interface FunctionDeclaration extends StatementFunctionBase, NamedDeclaration {
	readonly kind: SyntaxKind.FunctionDeclaration;
	// function a::b::c::d() {}
	readonly name: Identifier | ComputedName;
}

export interface LocalFunctionDeclaration extends StatementFunctionBase, NamedDeclaration {
	readonly kind: SyntaxKind.LocalFunctionDeclaration;
	readonly name: Identifier;
}

export interface FunctionExpression extends StatementFunctionBase {
	readonly kind: SyntaxKind.FunctionExpression;
}

export interface LambdaExpression extends FunctionLikeDeclarationBase {
	readonly kind: SyntaxKind.LambdaExpression;
	readonly expression: Expression;
}


export interface MethodDeclarationBase extends StatementFunctionBase, NamedDeclaration {
	readonly kind: SyntaxKind.ClassMethod | SyntaxKind.TableMethod;
	readonly name: Identifier;
}

export interface ConstructorDeclarationBase extends StatementFunctionBase {
	readonly kind: SyntaxKind.ClassConstructor | SyntaxKind.TableConstructor;
	// function constructor() {} | constructor() {} both work
	readonly hasPrecedingFunction: boolean;
}


export interface PropertyAssignmentBase extends NamedDeclaration {
	readonly kind: SyntaxKind.ClassPropertyAssignment | SyntaxKind.TablePropertyAssignment | SyntaxKind.EnumMember | SyntaxKind.PostCallInitialiserPropertyAssignment;
	readonly initialiser?: Expression;
}



export interface Expression extends Node {

}

export interface UnaryExpression extends Expression {

}

export interface PrimaryExpression extends UnaryExpression {

}

export interface RootAccessExpression extends PrimaryExpression {
	readonly kind: SyntaxKind.RootAccessExpression;
	readonly name: Identifier;
}

export interface ParenthesisedExpression extends PrimaryExpression {
	readonly kind: SyntaxKind.ParenthesisedExpression;
	readonly expression: Expression;
}


export interface ThisExpression extends PrimaryExpression {
	readonly kind: SyntaxKind.ThisExpression;
}

export interface BaseExpression extends PrimaryExpression {
	readonly kind: SyntaxKind.BaseExpression;
}

export interface FileExpression extends PrimaryExpression {
	readonly kind: SyntaxKind.FileExpression;
}

export interface LineExpression extends PrimaryExpression {
	readonly kind: SyntaxKind.LineExpression;
}


export interface LiteralExpression extends PrimaryExpression {
	readonly value: string;
}

export interface IntegerLiteral extends LiteralExpression {
	readonly kind: SyntaxKind.IntegerLiteral;
}

export interface FloatLiteral extends LiteralExpression {
	readonly kind: SyntaxKind.FloatLiteral;
}

export interface StringLiteral extends LiteralExpression {
	readonly kind: SyntaxKind.StringLiteral;
}

export interface VerbatimStringLiteral extends LiteralExpression {
	readonly kind: SyntaxKind.VerbatimStringLiteral;
}

export interface Identifier extends LiteralExpression {
	readonly kind: SyntaxKind.Identifier;
}

export interface NullLiteral extends PrimaryExpression {
	readonly kind: SyntaxKind.NullLiteral;
}

export interface TrueLiteral extends PrimaryExpression {
	readonly kind: SyntaxKind.TrueLiteral;
}

export interface FalseLiteral extends PrimaryExpression {
	readonly kind: SyntaxKind.FalseLiteral;
}

export type BooleanLiteral = TrueLiteral | FalseLiteral;


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

export interface PostCallInitialiser extends Node {
	readonly kind: SyntaxKind.PostCallInitialiser;
	readonly members: NodeArray<TableLiteralMember>;
}

export interface PostCallInitialiserPropertyAssignment extends PropertyAssignmentBase {
	readonly kind: SyntaxKind.PostCallInitialiserPropertyAssignment;
	readonly initialiser: Expression;
	// readonly name: Identifier | ComputedName;
}

export interface CallLikeBase {
	readonly kind: SyntaxKind.CallExpression | SyntaxKind.RawCallExpression;
	readonly argumentExpressions: NodeArray<Expression>;
	readonly postCallInitialiser?: PostCallInitialiser;
}

export interface RawCallExpression extends CallLikeBase, UnaryExpression {
	readonly kind: SyntaxKind.RawCallExpression;
}



export type BinaryOperator =
	| SyntaxKind.CommaToken
	| SyntaxKind.BarBarToken
	| SyntaxKind.AmpersandAmpersandToken
	| SyntaxKind.BarToken
	| SyntaxKind.CaretToken
	| SyntaxKind.AmpersandToken
	| SyntaxKind.EqualsEqualsToken
	| SyntaxKind.ExclamationEqualsToken
	| SyntaxKind.LessThanEqualsGreaterThanToken
	| SyntaxKind.LessThanToken
	| SyntaxKind.GreaterThanToken
	| SyntaxKind.LessThanEqualsToken
	| SyntaxKind.GreaterThanEqualsToken
	| SyntaxKind.InstanceOfKeyword
	| SyntaxKind.InKeyword
	| SyntaxKind.LessThanLessThanToken
	| SyntaxKind.GreaterThanGreaterThanToken
	| SyntaxKind.GreaterThanGreaterThanGreaterThanToken
	| SyntaxKind.PlusToken
	| SyntaxKind.MinusToken
	| SyntaxKind.AsteriskToken
	| SyntaxKind.SlashToken
	| SyntaxKind.PercentToken
	| AssignmentOperator;

export const enum OperatorPrecedence {
	Lowest, // Used to begin the precedence climbing
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

	Invalid = -1,
}

export function getBinaryOperatorPrecedence(kind: SyntaxKind): OperatorPrecedence {
	switch (kind) {
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

/*
export type ScalarLiteralExpression =
	| NumericLiteral
	| StringLiteral
	| BooleanLiteral
	// -1 -1.0
	| PrefixUnaryExpression;*/

export type PostfixUnaryOperator =
	| SyntaxKind.PlusPlusToken
	| SyntaxKind.MinusMinusToken;

export interface PostfixUnaryExpression extends UnaryExpression {
	readonly kind: SyntaxKind.PostfixUnaryExpression;
	readonly operand: Expression;
	readonly operator: PostfixUnaryOperator;
}

export type PrefixUnaryOperator =
	| SyntaxKind.PlusPlusToken
	| SyntaxKind.MinusMinusToken
	| SyntaxKind.PlusToken
	| SyntaxKind.MinusToken
	| SyntaxKind.TildeToken
	| SyntaxKind.ExclamationToken;

export interface PrefixUnaryExpression extends UnaryExpression {
	readonly kind: SyntaxKind.PrefixUnaryExpression;
	readonly operator: PrefixUnaryOperator;
	readonly operand: UnaryExpression;
}

export interface BinaryExpression extends Expression {
	readonly kind: SyntaxKind.BinaryExpression;
	readonly left: Expression;
	readonly operator: BinaryOperator;
	readonly right: Expression;
}


export interface ConditionalExpression extends Expression {
	readonly kind: SyntaxKind.ConditionalExpression;
	readonly condition: Expression;
	readonly whenTrue: Expression;
	readonly whenFalse: Expression;
}

export interface PropertyAccessExpression extends Expression {
	readonly kind: SyntaxKind.PropertyAccessExpression;
	readonly expression: Expression;
	readonly property: Identifier;
}

export interface ElementAccessExpression extends Expression {
	readonly kind: SyntaxKind.ElementAccessExpression;
	readonly expression: Expression;
	readonly argumentExpression: Expression;
}

export interface CallExpression extends CallLikeBase, Expression {
	readonly kind: SyntaxKind.CallExpression;
	readonly expression: Expression;
}


export interface ArrayLiteralExpression extends PrimaryExpression {
	readonly kind: SyntaxKind.ArrayLiteralExpression,
	readonly elements: NodeArray<Expression>
}



export interface TableLiteralExpression extends PrimaryExpression {
	readonly kind: SyntaxKind.TableLiteralExpression;
	readonly members: NodeArray<TableLiteralMember>;
}

export interface TableLiteralMember extends Declaration {
	
}

export interface TablePropertyAssignment extends TableLiteralMember, PropertyAssignmentBase {
	readonly kind: SyntaxKind.TablePropertyAssignment;
	readonly initialiser: Expression;
	parent?: TableLiteralExpression;
}

export interface TableMethod extends MethodDeclarationBase, TableLiteralMember {
	readonly kind: SyntaxKind.TableMethod;
	parent?: TableLiteralExpression;
}

export interface TableConstructor extends ConstructorDeclarationBase {
	readonly kind: SyntaxKind.TableConstructor;
	parent?: TableLiteralExpression;
}

export function isValidSlotExpression(kind: SyntaxKind) {
	switch (kind) {
	case SyntaxKind.PropertyAccessExpression:
	case SyntaxKind.ElementAccessExpression:
	case SyntaxKind.RootAccessExpression:
	case SyntaxKind.Identifier:
	case SyntaxKind.ConstructorKeyword:
		return true;
	default:
		return false;
	}
}

export const TokenToExpression = new Map<SyntaxKind, SyntaxKind>([
	[SyntaxKind.ThisKeyword, SyntaxKind.ThisExpression],
	[SyntaxKind.BaseKeyword, SyntaxKind.BaseExpression],
	[SyntaxKind.NullKeyword, SyntaxKind.NullLiteral],
	[SyntaxKind.TrueKeyword, SyntaxKind.TrueLiteral],
	[SyntaxKind.FalseKeyword, SyntaxKind.FalseLiteral],
	[SyntaxKind.__FILE__Keyword, SyntaxKind.FileExpression],
	[SyntaxKind.__LINE__Keyword, SyntaxKind.LineExpression],
	
	[SyntaxKind.StringToken, SyntaxKind.StringLiteral],
	[SyntaxKind.VerbatimStringToken, SyntaxKind.VerbatimStringLiteral],
	[SyntaxKind.IntegerToken, SyntaxKind.IntegerLiteral],
	[SyntaxKind.FloatToken, SyntaxKind.FloatLiteral],
]);

type ForEachChildFunction<TNode extends Node> = (node: TNode, callback: (childNode: Node) => void) => void;
type ForEachChildTable = { [kind in SyntaxKind]?: ForEachChildFunction<any>; }

function functionLike(node: FunctionDeclaration | LocalFunctionDeclaration | MethodDeclarationBase, callback: (childNode: Node) => void): void {
	callback(node.name);
	if (node.environment) {
		callback(node.environment);
	}
	callback(node.parameters);
	callback(node.statement);
}

function constructorLike(node: ConstructorDeclarationBase, callback: (childNode: Node) => void): void {
	if (node.environment) {
		callback(node.environment);
	}
	callback(node.parameters);
	callback(node.statement);
}

function propertyLike(node: PropertyAssignmentBase, callback: (childNode: Node) => void): void {
	callback(node.name);
	if (node.initialiser) {
		callback(node.initialiser);
	}
}

const forEachChildTable: ForEachChildTable = {
	[SyntaxKind.SourceFile]: function (node: SourceFile, callback: (childNode: Node) => void): void {
		callback(node.statements);	
	},
	[SyntaxKind.NodeArray]: function(node: NodeArray<Node>, callback: (childNode: Node) => void): void {
		for (const element of node.elements) {
			callback(element);
		}
	},
	[SyntaxKind.BlockStatement]: function(node: BlockStatement, callback: (childNode: Node) => void): void {
		callback(node.statements);
	},
	[SyntaxKind.IfStatement]: function (node: IfStatement, callback: (childNode: Node) => void): void {
		callback(node.expression);
		callback(node.thenStatement);
		if (node.elseStatement) {
			callback(node.elseStatement);
		}
	},
	[SyntaxKind.ExpressionStatement]: function(node: ExpressionStatement, callback: (childNode: Node) => void): void {
		callback(node.expression);
	},
	[SyntaxKind.LocalStatement]: function(node: LocalStatement, callback: (childNode: Node) => void): void {
		callback(node.declarations);
	},
	[SyntaxKind.ConstStatement]: function (node: ConstStatement, callback: (childNode: Node) => void): void {
		callback(node.name);
		callback(node.initialiser);
	},
	[SyntaxKind.VariableDeclaration]: function(node: VariableDeclaration, callback: (childNode: Node) => void): void {
		callback(node.name);
		if (node.initialiser) {
			callback(node.initialiser);
		}
	},
	[SyntaxKind.ForStatement]: function(node: ForStatement, callback: (childNode: Node) => void): void {
		if (node.initialiser) {
			callback(node.initialiser);
		}
		if (node.condition) {
			callback(node.condition);
		}
		if (node.incrementor) {
			callback(node.incrementor);
		}
		callback(node.statement);
	},
	[SyntaxKind.WhileStatement]: function(node: WhileStatement, callback: (childNode: Node) => void): void {
		callback(node.expression);
		callback(node.statement);
	},
	[SyntaxKind.DoStatement]: function(node: DoStatement, callback: (childNode: Node) => void): void {
		callback(node.statement);
		callback(node.expression);
	},
	[SyntaxKind.ForEachStatement]: function(node: ForEachStatement, callback: (childNode: Node) => void): void {
		if (node.index) {
			callback(node.index);
		}
		callback(node.value);
		callback(node.iterable);
		callback(node.statement);
	},
	[SyntaxKind.SwitchStatement]: function(node: SwitchStatement, callback: (childNode: Node) => void): void {
		callback(node.expression);
		callback(node.caseBlock);
	},
	[SyntaxKind.TryStatement]: function(node: TryStatement, callback: (childNode: Node) => void): void {
		callback(node.tryStatement);
		callback(node.catchClause);
	},
	[SyntaxKind.CatchClause]: function(node: CatchClause, callback: (childNode: Node) => void): void {
		callback(node.variable);
		callback(node.statement);
	},
	[SyntaxKind.FunctionDeclaration]: functionLike,
	[SyntaxKind.LocalFunctionDeclaration]: functionLike,
	[SyntaxKind.ReturnStatement]: function(node: ReturnStatement, callback: (childNode: Node) => void): void {
		if (node.expression) {
			callback(node.expression);
		}
	},
	[SyntaxKind.YieldStatement]: function(node: YieldStatement, callback: (childNode: Node) => void): void {
		if (node.expression) {
			callback(node.expression);
		}
	},
	[SyntaxKind.ThrowStatement]: function(node: ThrowStatement, callback: (childNode: Node) => void): void {
		callback(node.expression);
	},
	[SyntaxKind.ClassDeclaration]: function(node: ClassDeclaration, callback: (childNode: Node) => void): void {
		callback(node.name);
		if (node.inherits) {
			callback(node.inherits);
		}
		callback(node.members);
	},
	[SyntaxKind.ClassPropertyAssignment]: propertyLike,
	[SyntaxKind.ClassMethod]: functionLike,
	[SyntaxKind.ClassConstructor]: constructorLike,
	[SyntaxKind.TableLiteralExpression]: function(node: TableLiteralExpression, callback: (childNode: Node) => void): void {
		callback(node.members);
	},
	[SyntaxKind.TablePropertyAssignment]: propertyLike,
	[SyntaxKind.TableMethod]: functionLike,
	[SyntaxKind.TableConstructor]: constructorLike,
	[SyntaxKind.EnumDeclaration]: function(node: EnumDeclaration, callback: (childNode: Node) => void): void {
		callback(node.name);
		callback(node.members);
	},
	[SyntaxKind.EnumMember]: propertyLike,
	[SyntaxKind.CaseClause]: function(node: CaseClause, callback: (childNode: Node) => void): void {
		callback(node.expression);
		callback(node.statements);
	},
	[SyntaxKind.DefaultClause]: function(node: DefaultClause, callback: (childNode: Node) => void): void {
		callback(node.statements);
	},
	[SyntaxKind.BinaryExpression]: function(node: BinaryExpression, callback: (childNode: Node) => void): void {
		callback(node.left);
		callback(node.right);
	},
	[SyntaxKind.CallExpression]: function(node: CallExpression, callback: (childNode: Node) => void): void {
		callback(node.expression);
		callback(node.argumentExpressions);
	},
	[SyntaxKind.PostCallInitialiser]: function (node: PostCallInitialiser, callback: (childNode: Node) => void): void {
		callback(node.members);	
	},
	[SyntaxKind.PostCallInitialiserPropertyAssignment]: propertyLike,
	[SyntaxKind.PropertyAccessExpression]: function (node: PropertyAccessExpression, callback: (childNode: Node) => void): void {
		callback(node.expression);
		callback(node.property);
	},
	[SyntaxKind.ElementAccessExpression]: function(node: ElementAccessExpression, callback: (childNode: Node) => void): void {
		callback(node.expression);
		callback(node.argumentExpression);
	},
	[SyntaxKind.ArrayLiteralExpression]: function(node: ArrayLiteralExpression, callback: (childNode: Node) => void): void {
		callback(node.elements);
	},
	[SyntaxKind.ParenthesisedExpression]: function(node: ParenthesisedExpression, callback: (childNode: Node) => void): void {
		callback(node.expression);
	},
	[SyntaxKind.PrefixUnaryExpression]: function(node: PrefixUnaryExpression, callback: (childNode: Node) => void): void {
		callback(node.operand);
	},
	[SyntaxKind.PostfixUnaryExpression]: function(node: PostfixUnaryExpression, callback: (childNode: Node) => void): void {
		callback(node.operand);
	},
	[SyntaxKind.ConditionalExpression]: function(node: ConditionalExpression, callback: (childNode: Node) => void): void {
		callback(node.condition);
		callback(node.whenTrue);
		callback(node.whenFalse);
	},
	[SyntaxKind.DeleteExpression]: function(node: DeleteExpression, callback: (childNode: Node) => void): void {
		callback(node.expression);
	},
	[SyntaxKind.ResumeExpression]: function(node: ResumeExpression, callback: (childNode: Node) => void): void {
		callback(node.expression);
	},
	[SyntaxKind.CloneExpression]: function(node: CloneExpression, callback: (childNode: Node) => void): void {
		callback(node.expression);
	},
	[SyntaxKind.TypeOfExpression]: function(node: TypeOfExpression, callback: (childNode: Node) => void): void {
		callback(node.expression);
	},
	[SyntaxKind.RootAccessExpression]: function (node: RootAccessExpression, callback: (childNode: Node) => void): void {
		callback(node.name);
	},
	[SyntaxKind.FunctionExpression]: function (node: FunctionExpression, callback: (childNode: Node) => void): void {
		if (node.environment) {
			callback(node.environment);
		}
		callback(node.parameters);
		callback(node.statement);
	},
	[SyntaxKind.LambdaExpression]: function (node: LambdaExpression, callback: (childNode: Node) => void): void {
		if (node.environment) {
			callback(node.environment);
		}
		callback(node.parameters);
		callback(node.expression);
	},
	[SyntaxKind.ComputedName]: function (node: ComputedName, callback: (childNode: Node) => void): void {
		callback(node.expression);
	}
};

export function forEachChild(node: Node, callback: (childNode: Node) => void): void {
	const forEachChildFunction = forEachChildTable[node.kind];
	if (forEachChildFunction) {
		forEachChildFunction(node, callback);
	}
}

export function isDeclaration(node: Node) {
	switch (node.kind) {
	case SyntaxKind.VariableDeclaration:
	case SyntaxKind.ParameterDeclaration:
	case SyntaxKind.ClassPropertyAssignment:
	case SyntaxKind.TablePropertyAssignment:
		return true;
	default:
		return false;
	}
}