import { EmptyStatement, IfStatement, Node, NodeArray, SyntaxKind, Token, Block, BinaryExpression, CallExpression, ExpressionStatement, LocalStatement, ForStatement, WhileStatement, DoStatement as DoWhileStatement, ForEachStatement, SwitchStatement, TryStatement, FunctionDeclaration, ReturnStatement, YieldStatement, ThrowStatement, ContinueStatement, BreakStatement, VariableDeclaration, ParameterDeclaration, ClassDeclaration, MethodDeclaration, ConstructorDeclaration, LocalFunctionDeclaration, EnumDeclaration, EnumMember, CaseClause, DefaultClause, CatchClause, ArrayLiteralExpression, TableLiteralExpression, ParenthesisedExpression, PrefixUnaryExpression, PostfixUnaryExpression, ConditionalExpression, DeleteExpression, ResumeExpression, CloneExpression, TypeOfExpression, TokenNode, MemberAccessExpression, SubscriptExpression, ValuedToken, Expression, Statement, Identifier, StringLiteral, NumericLiteral, PrefixUnaryOperator, PostfixUnaryOperator, UnaryExpression, ThisExpression, BaseExpression, NullLiteral, TrueLiteral, FalseLiteral } from "./types";


type ForEachChildFunction<TNode extends Node> = (node: TNode, callback: (childNode: Node) => void) => void;
type ForEachChildTable = { [kind in SyntaxKind]?: ForEachChildFunction<any>; }

const forEachChildTable: ForEachChildTable = {
	[SyntaxKind.NodeArray]: function(node: NodeArray<Node>, callback: (childNode: Node) => void): void {
		for (const element of node.elements) {
			callback(element);
		}
	},
	[SyntaxKind.Block]: function(node: Block, callback: (childNode: Node) => void): void {
		callback(node.body);
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
		callback(node.declarationList);
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
	[SyntaxKind.DoWhileStatement]: function(node: DoWhileStatement, callback: (childNode: Node) => void): void {
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
		callback(node.tryBlock);
		callback(node.catchClause);
	},
	[SyntaxKind.CatchClause]: function(node: CatchClause, callback: (childNode: Node) => void): void {
		callback(node.variable);
		callback(node.block);
	},
	[SyntaxKind.FunctionDeclaration]: function(node: FunctionDeclaration, callback: (childNode: Node) => void): void {
		callback(node.name);
		callback(node.parameters);
		if (node.ellipsis) {
			callback(node.ellipsis);
		}
		callback(node.statement);
	},
	[SyntaxKind.LocalFunctionDeclaration]: function(node: LocalFunctionDeclaration, callback: (childNode: Node) => void): void {
		callback(node.name);
		callback(node.parameters);
		if (node.ellipsis) {
			callback(node.ellipsis);
		}
		callback(node.statement);
	},
	[SyntaxKind.ParameterDeclaration]: function(node: ParameterDeclaration, callback: (childNode: Node) => void): void {
		callback(node.name);
		if (node.initialiser) {
			callback(node.initialiser);
		}
	},
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
		if (node.extends) {
			callback(node.extends);
		}
		callback(node.members);
	},
	[SyntaxKind.MethodDeclaration]: function(node: MethodDeclaration, callback: (childNode: Node) => void): void {
		callback(node.name);
		callback(node.parameters);
		if (node.ellipsis) {
			callback(node.ellipsis);
		}
		callback(node.statement);
	},
	[SyntaxKind.ConstructorDeclaration]: function(node: ConstructorDeclaration, callback: (childNode: Node) => void): void {
		callback(node.parameters);
		if (node.ellipsis) {
			callback(node.ellipsis);
		}
		if (node.functionToken) {
			callback(node.functionToken);
		}
		callback(node.statement);
	},
	[SyntaxKind.EnumDeclaration]: function(node: EnumDeclaration, callback: (childNode: Node) => void): void {
		callback(node.name);
	},
	[SyntaxKind.EnumMember]: function(node: EnumMember, callback: (childNode: Node) => void): void {
		callback(node.name);
		callback(node.initializer);
	},
	[SyntaxKind.CaseClause]: function(node: CaseClause, callback: (childNode: Node) => void): void {
		callback(node.expression);
		callback(node.statements);
	},
	[SyntaxKind.DefaultClause]: function(node: DefaultClause, callback: (childNode: Node) => void): void {
		callback(node.statements);
	},
	[SyntaxKind.BinaryExpression]: function(node: BinaryExpression, callback: (childNode: Node) => void): void {
		callback(node.left);
		callback(node.operator);
		callback(node.right);
	},
	[SyntaxKind.CallExpression]: function(node: CallExpression, callback: (childNode: Node) => void): void {
		callback(node.expression);
		callback(node.arguments);
	},
	[SyntaxKind.MemberAccessExpression]: function(node: MemberAccessExpression, callback: (childNode: Node) => void): void {
		callback(node.member);
	},
	[SyntaxKind.SubscriptExpression]: function(node: SubscriptExpression, callback: (childNode: Node) => void): void {
		callback(node.expression);
	},
	[SyntaxKind.ArrayLiteralExpression]: function(node: ArrayLiteralExpression, callback: (childNode: Node) => void): void {
		callback(node.elements);
	},
	[SyntaxKind.TableLiteralExpression]: function(node: TableLiteralExpression, callback: (childNode: Node) => void): void {
		// Table elements are not nodes, they're expressions in an object
		for (const element of Object.values(node.elements)) {
			callback(element);
		}
	},
	[SyntaxKind.ParenthesisedExpression]: function(node: ParenthesisedExpression, callback: (childNode: Node) => void): void {
		callback(node.expression);
	},
	[SyntaxKind.PrefixUnaryExpression]: function(node: PrefixUnaryExpression, callback: (childNode: Node) => void): void {
		callback(node.operator);
		callback(node.operand);
	},
	[SyntaxKind.PostfixUnaryExpression]: function(node: PostfixUnaryExpression, callback: (childNode: Node) => void): void {
		callback(node.operand);
		callback(node.operator);
	},
	[SyntaxKind.ConditionalExpression]: function(node: ConditionalExpression, callback: (childNode: Node) => void): void {
		callback(node.condition);
		callback(node.whenTrue);
		if (node.whenFalse) {
			callback(node.whenFalse);
		}
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
	}
};

export function forEachChild(node: Node, callback: (childNode: Node) => void): void {
	const forEachChildFunction = forEachChildTable[node.kind];
	if (forEachChildFunction) {
		forEachChildFunction(node, callback);
	}
}

function overrideParentInImmediateChildren(node: Node) {
	forEachChild(node, (childNode: Node) => childNode.parent = node);
}



export function createNodeArray<T extends Node>(start: number, elements: T[]): NodeArray<T> {
	const node: NodeArray<T> = {
		kind: SyntaxKind.NodeArray,
		start,
		end: elements.length > 0 ? elements[elements.length - 1].end : start,
		elements
	};
	overrideParentInImmediateChildren(node);
	return node;
}


export function createTokenNode<T extends SyntaxKind>(start: number, end: number, kind: T): TokenNode<T> {
	return { kind, start, end };
}

export function createNodeFromToken<T extends SyntaxKind>(token: Token<T>): TokenNode<T> {
	return createTokenNode(token.start, token.end, token.kind);
}

export function createIdentifier(start: number, end: number, value: string): Identifier {
	return {
		kind: SyntaxKind.Identifier,
		start,
		end,
		value
	};
}

export function createStringLiteral(start: number, end: number, value: string, isVerbatim: boolean): StringLiteral {
	return {
		kind: isVerbatim ? SyntaxKind.VerbatimStringLiteral : SyntaxKind.StringLiteral,
		start,
		end,
		value
	};
}

export function createNumericLiteral(start: number, end: number, value: string, isFloat: boolean): NumericLiteral {
	return {
		kind: isFloat ? SyntaxKind.FloatLiteral : SyntaxKind.IntegerLiteral,
		start,
		end,
		value
	};
}

export function createVariableDeclaration(name: Identifier, initialiser?: Expression): VariableDeclaration {
	const node: VariableDeclaration = {
		kind: SyntaxKind.VariableDeclaration,
		start: name.start,
		end: initialiser ? initialiser.end : name.end,
		name,
		initialiser
	};
	overrideParentInImmediateChildren(node);
	return node;
}

export function createMissingNode<T extends Node>(start: number, kind: T["kind"]): T {
	const result = kind === SyntaxKind.Identifier ? createIdentifier(start, start, "")
		: kind === SyntaxKind.StringLiteral ? createStringLiteral(start, start, "", false)
		: kind === SyntaxKind.IntegerLiteral ? createNumericLiteral(start, start, "", false)
		: createTokenNode(start, start, kind);

	return result as T;
}

export function isNodeMissing(token: TokenNode<SyntaxKind>): boolean {
	return token.start === token.end;
}

export function createEmptyStatement(start: number, end: number): EmptyStatement {
	return {
		kind: SyntaxKind.EmptyStatement,
		start,
		end
	};
}

export function createBlockStatement(start: number, statements: NodeArray<Statement>, end: number): Block {
	return {
		kind: SyntaxKind.Block,
		start,
		end,
		body: statements
	};
}

export function createIfStatement(start: number, expression: Expression, thenStatement: Statement, elseStatement?: Statement): IfStatement {
	const node: IfStatement = {
		kind: SyntaxKind.IfStatement,
		start,
		end: elseStatement ? elseStatement.end : thenStatement.end,
		expression,
		thenStatement,
		elseStatement
	};
	overrideParentInImmediateChildren(node);
	return node;
}

export function createWhileStatement(start: number, expression: Expression, statement: Statement): WhileStatement {
	const node: WhileStatement = {
		kind: SyntaxKind.WhileStatement,
		start,
		end: statement.end,
		expression,
		statement
	};
	overrideParentInImmediateChildren(node);
	return node;
}

export function createDoStatement(start: number, statement: Statement, expression: Expression, end: number): DoWhileStatement {
	const node: DoWhileStatement = {
		kind: SyntaxKind.DoWhileStatement,
		start,
		end,
		statement,
		expression
	};
	overrideParentInImmediateChildren(node);
	return node;
}

export function createForStatement(start: number, initialiser: LocalStatement | Expression | undefined, condition: Expression | undefined, incrementor: Expression | undefined, statement: Statement): ForStatement {
	const node: ForStatement = {
		kind: SyntaxKind.ForStatement,
		start,
		end: statement.end,
		initialiser,
		condition,
		incrementor,
		statement
	};
	overrideParentInImmediateChildren(node);
	return node;
}

export function createForEachStatement(start: number, index: Identifier | undefined, value: Identifier, iterable: Expression, statement: Statement): ForEachStatement {
	const node: ForEachStatement = {
		kind: SyntaxKind.ForEachStatement,
		start,
		end: statement.end,
		index: index ? createVariableDeclaration(index) : undefined,
		value: createVariableDeclaration(value),
		iterable,
		statement
	};
	overrideParentInImmediateChildren(node);
	return node;
}

export function createBinaryExpression(start: number, left: Expression, operator: Token<SyntaxKind>, right: Expression): BinaryExpression {
	const node: BinaryExpression = {
		kind: SyntaxKind.BinaryExpression,
		start,
		end: right.end,
		left,
		operator: createNodeFromToken(operator),
		right
	};
	overrideParentInImmediateChildren(node);
	return node;
}

export function createConditionalExpression(start: number, condition: Expression, whenTrue: Expression, whenFalse?: Expression): ConditionalExpression {
	const node: ConditionalExpression = {
		kind: SyntaxKind.ConditionalExpression,
		start,
		end: whenFalse ? whenFalse.end : whenTrue.end,
		condition,
		whenTrue,
		whenFalse
	};
	overrideParentInImmediateChildren(node);
	return node;
}

export function createPrefixUnaryExpression(start: number, operator: Token<SyntaxKind>, operand: Expression): PrefixUnaryExpression {
	const node: PrefixUnaryExpression = {
		kind: SyntaxKind.PrefixUnaryExpression,
		start,
		end: operand.end,
		operator: createNodeFromToken(operator) as TokenNode<PrefixUnaryOperator>,
		operand: operand as UnaryExpression
	};
	overrideParentInImmediateChildren(node);
	return node;
}

export function createPostfixUnaryExpression(start: number, operand: Expression, operator: Token<SyntaxKind>): PostfixUnaryExpression {
	const node: PostfixUnaryExpression = {
		kind: SyntaxKind.PostfixUnaryExpression,
		start,
		end: operator.end,
		operand,
		operator: createNodeFromToken(operator) as TokenNode<PostfixUnaryOperator>
	};
	overrideParentInImmediateChildren(node);
	return node;
}

export function createParenthesisedExpression(start: number, expression: Expression, closing: TokenNode<SyntaxKind.CloseParenthesisToken>): ParenthesisedExpression {
	const node: ParenthesisedExpression = {
		kind: SyntaxKind.ParenthesisedExpression,
		start,
		end: closing.end,
		expression
	};
	overrideParentInImmediateChildren(node);
	return node;
}

export function createCallExpression(start: number, expression: Expression, arguments_: NodeArray<Expression>): CallExpression {
	const node: CallExpression = {
		kind: SyntaxKind.CallExpression,
		start,
		end: arguments_.end,
		expression,
		arguments: arguments_
	};
	overrideParentInImmediateChildren(node);
	return node;
}

export function createMemberAccessExpression(start: number, member: Identifier): MemberAccessExpression {
	const node: MemberAccessExpression = {
		kind: SyntaxKind.MemberAccessExpression,
		start,
		end: member.end,
		member
	};
	overrideParentInImmediateChildren(node);
	return node;
}

export function createSubscriptExpression(start: number, expression: Expression, subscript: Expression, closing: TokenNode<SyntaxKind.CloseBracketToken>): SubscriptExpression {
	const node: SubscriptExpression = {
		kind: SyntaxKind.SubscriptExpression,
		start,
		end: closing.end,
		expression
	};
	overrideParentInImmediateChildren(node);
	return node;
}

export function createArrayLiteralExpression(start: number, elements: NodeArray<Expression>, closing: TokenNode<SyntaxKind.CloseBracketToken>): ArrayLiteralExpression {
	const node: ArrayLiteralExpression = {
		kind: SyntaxKind.ArrayLiteralExpression,
		start,
		end: closing.end,
		elements
	};
	overrideParentInImmediateChildren(node);
	return node;
}

export function createTableLiteralExpression(start: number, elements: { [name: string]: Expression }, closing: TokenNode<SyntaxKind.CloseBraceToken>): TableLiteralExpression {
	const node: TableLiteralExpression = {
		kind: SyntaxKind.TableLiteralExpression,
		start,
		end: closing.end,
		elements
	};
	overrideParentInImmediateChildren(node);
	return node;
}

export function createDeleteExpression(start: number, expression: Expression): DeleteExpression {
	const node: DeleteExpression = {
		kind: SyntaxKind.DeleteExpression,
		start,
		end: expression.end,
		expression
	};
	overrideParentInImmediateChildren(node);
	return node;
}

export function createResumeExpression(start: number, expression: Expression): ResumeExpression {
	const node: ResumeExpression = {
		kind: SyntaxKind.ResumeExpression,
		start,
		end: expression.end,
		expression
	};
	overrideParentInImmediateChildren(node);
	return node;
}

export function createCloneExpression(start: number, expression: Expression): CloneExpression {
	const node: CloneExpression = {
		kind: SyntaxKind.CloneExpression,
		start,
		end: expression.end,
		expression
	};
	overrideParentInImmediateChildren(node);
	return node;
}

export function createTypeOfExpression(start: number, expression: Expression): TypeOfExpression {
	const node: TypeOfExpression = {
		kind: SyntaxKind.TypeOfExpression,
		start,
		end: expression.end,
		expression
	};
	overrideParentInImmediateChildren(node);
	return node;
}

export function createThisExpression(start: number): ThisExpression {
	return {
		kind: SyntaxKind.ThisKeyword,
		start,
		end: start + 4 // "this" is 4 characters
	};
}

export function createBaseExpression(start: number): BaseExpression {
	return {
		kind: SyntaxKind.BaseKeyword,
		start,
		end: start + 4 // "base" is 4 characters
	};
}

export function createNullLiteral(start: number): NullLiteral {
	return {
		kind: SyntaxKind.NullKeyword,
		start,
		end: start + 4 // "null" is 4 characters
	};
}

export function createTrueLiteral(start: number): TrueLiteral {
	return {
		kind: SyntaxKind.TrueKeyword,
		start,
		end: start + 4 // "true" is 4 characters
	};
}

export function createFalseLiteral(start: number): FalseLiteral {
	return {
		kind: SyntaxKind.FalseKeyword,
		start,
		end: start + 5 // "false" is 5 characters
	};
}