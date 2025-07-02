import { Lexer } from "./lexer";

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
	detail: string;
	desc?: string;
	successor?: string;
	append?: string;
	snippet?: string;
	[param: number]: StringKind | undefined;
};

export type Docs = Map<string, Doc>;

export type InstanceDocs = Map<string, Docs>;

export const enum SyntaxKind {
	Skip = -2,
	Invalid = -1,
	EOF = 0,

	LineFeedToken,
	OpenRoundToken,
	CloseRoundToken,
	OpenCurlyToken,
	CloseCurlyToken,
	OpenSquareToken,
	RightSquareToken,
	SemicolonToken,
	CommaToken,
	QuestionToken,
	CaretToken,
	TildaToken,
	DotToken,
	ColonToken,
	PlusToken,
	MinusToken,
	AsteriskToken,
	SlashToken,
	PercentToken,
	AmpersandToken,
	PipeToken,
	LessThanToken,
	GreaterThanToken,
	EqualsToken,
	ExclamationToken,
	AtToken,

	PlusPlusToken,
	MinusMinusToken,
	EqualsEqualsToken,
	LessMinusToken,
	NotEqualsToken,
	LessThanEqualsToken,
	GreaterThanEqualsToken,
	AmpersandAmpersandToken,
	PipePipeToken,
	PlusEqualsToken,
	MinusEqualsToken,
	LessThanLessThanToken,
	GreaterThanGreaterThanToken,
	ColonColonToken,
	LessThanEqualsGreaterThanToken,
	GreaterThanGreaterThanGreaterThanToken,
	AsteriskEqualsToken,
	SlashEqualsToken,
	PercentEqualsToken,
	LessThanSlashToken,
	SlashGreaterThanToken,

	StringToken,
	VerbatimStringToken,
	IntegerToken,
	FloatToken,

	IdentifierToken,
	
	NullKeyword,
	TrueKeyword,
	FalseKeyword,

	BaseKeyword,
	DeleteKeyword,
	SwitchKeyword,
	IfKeyword,
	ElseKeyword,
	WhileKeyword,
	BreakKeyword,
	ForKeyword,
	DoKeyword,
	ForeachKeyword,
	InKeyword,
	LocalKeyword,
	CloneKeyword,
	FunctionKeyword,
	ReturnKeyword,
	TypeOfKeyword,
	ContinueKeyword,
	YieldKeyword,
	TryKeyword,
	CatchKeyword,
	ThrowKeyword,
	ResumeKeyword,
	CaseKeyword,
	DefaultKeyword,
	ThisKeyword,
	ClassKeyword,
	ExtendsKeyword,
	ConstructorKeyword,
	InstanceOfKeyword,
	DotDotDotToken,
	StaticKeyword,
	EnumKeyword,
	ConstKeyword,
	RawCallKeyword,

	__LINE__,
	__FILE__,

	LineComment,
	BlockComment,
	DocComment,

	IdentifierExpression,
	BlockStatement,
	LocalDeclarationStatement,
	LocalDeclaration,
	ConstDeclarationStatement,
	NumericLiteral,
	StringLiteral,
	BinaryExpression,

	NullLiteral,
	BooleanLiteral,

	CommaExpression,
	FunctionDeclarationStatement,
	ParameterDeclaration
};

export const tokenKindToString = new Map<SyntaxKind, string>([
	[SyntaxKind.EOF, 'EOF'],

	[SyntaxKind.LineFeedToken, 'line feed'],
	[SyntaxKind.OpenRoundToken, '('],
	[SyntaxKind.CloseRoundToken, ')'],
	[SyntaxKind.OpenCurlyToken, '{'],
	[SyntaxKind.CloseCurlyToken, '}'],
	[SyntaxKind.OpenSquareToken, '['],
	[SyntaxKind.RightSquareToken, ']'],
	[SyntaxKind.SemicolonToken, ';'],
	[SyntaxKind.CommaToken, ','],
	[SyntaxKind.QuestionToken, '?'],
	[SyntaxKind.CaretToken, '^'],
	[SyntaxKind.TildaToken, '~'],
	[SyntaxKind.DotToken, '.'],
	[SyntaxKind.ColonToken, ':'],
	[SyntaxKind.PlusToken, '+'],
	[SyntaxKind.MinusToken, '-'],
	[SyntaxKind.AsteriskToken, '*'],
	[SyntaxKind.SlashToken, '/'],
	[SyntaxKind.PercentToken, '%'],
	[SyntaxKind.AmpersandToken, '&'],
	[SyntaxKind.PipeToken, '|'],
	[SyntaxKind.LessThanToken, '<'],
	[SyntaxKind.GreaterThanToken, '>'],
	[SyntaxKind.EqualsToken, '='],
	[SyntaxKind.ExclamationToken, '!'],
	[SyntaxKind.AtToken, '@'],

	[SyntaxKind.EqualsEqualsToken, '=='],
	[SyntaxKind.NotEqualsToken, '!='],
	[SyntaxKind.LessThanEqualsToken, '<='],
	[SyntaxKind.GreaterThanEqualsToken, '>='],
	[SyntaxKind.LessThanLessThanToken, '<<'],
	[SyntaxKind.GreaterThanGreaterThanToken, '>>'],
	[SyntaxKind.GreaterThanGreaterThanGreaterThanToken, '>>>'],
	[SyntaxKind.LessThanEqualsGreaterThanToken, '<=>'],
	[SyntaxKind.LessMinusToken, '<-'],
	[SyntaxKind.ColonColonToken, '::'],
	[SyntaxKind.PlusEqualsToken, '+='],
	[SyntaxKind.MinusEqualsToken, '-='],
	[SyntaxKind.AsteriskEqualsToken, '*='],
	[SyntaxKind.SlashEqualsToken, '/='],
	[SyntaxKind.PercentEqualsToken, '%='],
	[SyntaxKind.PlusPlusToken, '++'],
	[SyntaxKind.MinusMinusToken, '--'],
	[SyntaxKind.LessThanSlashToken, '</'],
	[SyntaxKind.SlashGreaterThanToken, '/>'],
	[SyntaxKind.DotDotDotToken, '...'],

	// Literals and Identifiers
	[SyntaxKind.IdentifierToken, 'identifier'],
	[SyntaxKind.StringToken, 'string'],
	[SyntaxKind.VerbatimStringToken, 'string'],
	[SyntaxKind.IntegerToken, 'integer'],
	[SyntaxKind.FloatToken, 'float'],

	// Keywords
	[SyntaxKind.IfKeyword, 'if'],
	[SyntaxKind.ElseKeyword, 'else'],
	[SyntaxKind.WhileKeyword, 'while'],
	[SyntaxKind.ForKeyword, 'for'],
	[SyntaxKind.ForeachKeyword, 'foreach'],
	[SyntaxKind.InKeyword, 'in'],
	[SyntaxKind.BreakKeyword, 'break'],
	[SyntaxKind.ContinueKeyword, 'continue'],
	[SyntaxKind.ReturnKeyword, 'return'],
	[SyntaxKind.TryKeyword, 'try'],
	[SyntaxKind.CatchKeyword, 'catch'],
	[SyntaxKind.ThrowKeyword, 'throw'],
	[SyntaxKind.YieldKeyword, 'yield'],
	[SyntaxKind.ResumeKeyword, 'resume'],
	[SyntaxKind.SwitchKeyword, 'switch'],
	[SyntaxKind.CaseKeyword, 'case'],
	[SyntaxKind.DefaultKeyword, 'default'],

	[SyntaxKind.NullKeyword, 'null'],
	[SyntaxKind.TrueKeyword, 'true'],
	[SyntaxKind.FalseKeyword, 'false'],
	[SyntaxKind.LocalKeyword, 'local'],
	[SyntaxKind.TypeOfKeyword, 'typeof'],
	[SyntaxKind.InstanceOfKeyword, 'instanceof'],
	[SyntaxKind.CloneKeyword, 'clone'],
	[SyntaxKind.FunctionKeyword, 'function'],
	[SyntaxKind.ClassKeyword, 'class'],
	[SyntaxKind.ConstructorKeyword, 'constructor'],
	[SyntaxKind.ExtendsKeyword, 'extends'],
	[SyntaxKind.ThisKeyword, 'this'],
	[SyntaxKind.StaticKeyword, 'static'],
	[SyntaxKind.EnumKeyword, 'enum'],
	[SyntaxKind.ConstKeyword, 'const'],
	[SyntaxKind.RawCallKeyword, 'rawcall'],
	[SyntaxKind.DeleteKeyword, 'delete'],

	// Special tokens
	[SyntaxKind.__LINE__, '__LINE__'],
	[SyntaxKind.__FILE__, '__FILE__'],

]);

export const reservedIdentifiers = new Map<string, SyntaxKind>([
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
	['foreach', SyntaxKind.ForeachKeyword],
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
	['__LINE__', SyntaxKind.__LINE__],
	['__FILE__', SyntaxKind.__FILE__],
	['rawcall', SyntaxKind.RawCallKeyword]
]);

export function isTokenAComment(token: Token): boolean {
	const kind = token.kind;
	return kind === SyntaxKind.LineComment || kind === SyntaxKind.BlockComment || kind === SyntaxKind.DocComment;
}

export function isTokenSkippable(token: Token): boolean {
	return isTokenAComment(token) || token.kind === SyntaxKind.LineFeedToken;
}

export function isTokenAString(token: Token): boolean {
	const kind = token.kind;
	return kind === SyntaxKind.StringToken || kind === SyntaxKind.VerbatimStringToken;
}


export interface Error {
	message: string,
	start: number,
	end: number
}

export interface Token {
	kind: SyntaxKind;
	value: string;
	start: number;
	end: number;
}

export interface StringToken extends Token {
	sourcePositions: number[];
	lexer?: Lexer;
}

export interface ASTNode {
	readonly kind: SyntaxKind;

	start: number;
	end: number;
	parent?: ASTNode;
}

export interface Statement extends ASTNode { }

export interface BlockStatement extends Statement {
	kind: SyntaxKind.BlockStatement;
	body: Statement[];
}

export interface ParameterDeclaration extends ASTNode {
	kind: SyntaxKind.ParameterDeclaration;
	name: string;
	initialiser: Expression;
}

export interface FunctionDeclarationStatement {
	kind: SyntaxKind.FunctionDeclarationStatement;
	name: string;
	parameters: ParameterDeclaration[];
	body: BlockStatement;
	isLocal: boolean;
}

export interface Expression extends ASTNode { }

export interface CommaExpression extends Expression {
	kind: SyntaxKind.CommaExpression;
	body: Expression[];
}

export interface IdentifierExpression extends ASTNode {
	kind: SyntaxKind.IdentifierExpression;
	value: string;
}

export interface BinaryExpression extends Expression {
	kind: SyntaxKind.BinaryExpression;
	left: Expression;
	right: Expression;
	operator: string;
}

export interface NumericLiteral extends Expression {
	kind: SyntaxKind.NumericLiteral;
	value: number;
}

export interface StringLiteral extends Expression {
	kind: SyntaxKind.StringLiteral;
	value: string;
	isVerbatim: boolean;
}

export interface NullLiteral extends Expression {
	kind: SyntaxKind.NullLiteral;
	value: null;
}

export interface BooleanLiteral extends Expression {
	kind: SyntaxKind.BooleanLiteral;
	value: boolean;
}

export type ScalarLiteral = NumericLiteral | StringLiteral | BooleanLiteral;

export interface LocalDeclaration extends ASTNode {
	kind: SyntaxKind.LocalDeclaration;
	name: string;
	initialiser?: Expression;
}

export interface LocalDeclarationStatement extends Statement {
	kind: SyntaxKind.LocalDeclarationStatement;
	declarations: LocalDeclaration[];
};


export interface ConstDeclarationStatement extends Statement {
	kind: SyntaxKind.ConstDeclarationStatement;
	name: string;
	initialiser: ScalarLiteral;
}