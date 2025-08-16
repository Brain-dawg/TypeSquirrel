import { isMissingNode } from "./parser";
import { Node, SyntaxKind, Symbol, SymbolFlags, SymbolTable, Declaration, SourceFile, VariableDeclaration, FunctionDeclaration, LocalFunctionDeclaration, ClassDeclaration, ClassPropertyAssignment, ClassMethod, ClassConstructor, EnumDeclaration, EnumMember, ConstStatement, PropertyAccessExpression, ElementAccessExpression, LocalsContainer, forEachChild, TablePropertyAssignment, TableMethod, ParameterDeclaration, TableConstructor, TableLiteralExpression, ClassExpression, FunctionExpression, LambdaExpression, PrimaryExpression, RootAccessExpression, StringLiteral, VerbatimStringLiteral, Name } from "./types";

export const enum ContainerFlags {
	None = 0,
	IsContainer            = 1 << 0, // Node is a container (function, class, block)
	IsBlockScopedContainer = 1 << 1, // Node creates block scope (for, foreach, catch)
	HasLocals              = 1 << 2, // Node has its own locals symbol table
	IsFunctionLike         = 1 << 3  // Node is function-like (function, method, constructor)
}

export const enum MissingSymbolName {
	Function = "<function>",
	Class = "<class>",
	Table = "<table>",
	Property = "<property>",
	Method = "<method>",
	EnumMember = "<enum member>"
}


function createSymbolTable(): SymbolTable {
	return new Map<string, Symbol[]>();
}

function appendOrCreateArrayValue<T, V>(map: Map<T, V[]>, key: T, value: V) {
	const array = map.get(key);
	if (array) {
		array.push(value);
	} else {
		map.set(key, [value]);
	}
}

export class Binder {
	private container: SymbolTable;
	private blockScopeContainer: SymbolTable;
	private symbolCount = 0;

	constructor() {
		this.container = undefined!;
		this.blockScopeContainer = undefined!;
	}

	public bindSourceFile(file: SourceFile): void {
		file.locals = createSymbolTable();

		this.container = file.locals;
		this.blockScopeContainer = file.locals;

		this.bind(file);
	}

	private extractName(name: Name): string | undefined {
		if (name.kind !== SyntaxKind.ComputedName) {
			return !isMissingNode(name) ? name.value : undefined;
		}
		const expr = name.expression;
		switch (expr.kind) {
		case SyntaxKind.RootAccessExpression: {
			const name = (expr as RootAccessExpression).name;
			return !isMissingNode(name) ? name.value : undefined;
		}
		case SyntaxKind.PropertyAccessExpression: {
			const name = (expr as PropertyAccessExpression).property;
			return !isMissingNode(name) ? name.value : undefined;
		}
		case SyntaxKind.ElementAccessExpression:
			const name = (expr as ElementAccessExpression).argumentExpression;
			if (isMissingNode(name) || name.kind !== SyntaxKind.StringLiteral && name.kind !== SyntaxKind.VerbatimStringLiteral) {
				return undefined;
			}

			return (name as StringLiteral | VerbatimStringLiteral).value || undefined;
		default:
			return undefined;
		}
	}

	private createSymbol(node: Declaration, name: string, flags: SymbolFlags) {
		this.symbolCount++;
		const symbol: Symbol = {
			flags,
			name,
			declaration: node,
			members: undefined
		};

		node.symbol = symbol;
		appendOrCreateArrayValue(flags & SymbolFlags.Variable ? this.blockScopeContainer : this.container, symbol.name, symbol);
	}

	private bind(node?: Node): void {
		if (!node) {
			return;
		}

		this.bindWorker(node);

		const containerFlags = this.getContainerFlags(node);

		if (containerFlags !== ContainerFlags.None) {
			this.bindContainer(node, containerFlags);
		} else {
			// Bind children recursively
			this.bindChildren(node);
		}
	}

	private bindContainer(node: Node, containerFlags: ContainerFlags): void {
		const saveContainer = this.container;
		const saveBlockScopeContainer = this.blockScopeContainer;

		// if (containerFlags & (ContainerFlags.IsContainer | ContainerFlags.IsBlockScopedContainer)) {
		let container: SymbolTable;
		if (containerFlags & ContainerFlags.HasLocals) {
			(node as LocalsContainer).locals = container = createSymbolTable();
		} else {
			(node as Declaration).symbol!.members = container = createSymbolTable();
		}

		
		this.blockScopeContainer = container;
		if (containerFlags & ContainerFlags.IsContainer) {
			this.container = container;
		}
		//}

		this.bindChildren(node);

		this.container = saveContainer;
		this.blockScopeContainer = saveBlockScopeContainer;
	}

	private bindChildren(node: Node): void {
		forEachChild(node, this.bind.bind(this));
	}

	private bindWorker(node: Node): void {
		switch (node.kind) {
		case SyntaxKind.VariableDeclaration:
			this.bindVariableDeclaration(node as VariableDeclaration);
			break;
		case SyntaxKind.ParameterDeclaration:
			this.bindParameterDeclaration(node as ParameterDeclaration);
			break;
		case SyntaxKind.ConstStatement:
			this.bindConstStatement(node as ConstStatement);
			break;
		case SyntaxKind.FunctionDeclaration:
			this.bindFunctionDeclaration(node as FunctionDeclaration);
			break;
		case SyntaxKind.LocalFunctionDeclaration:
			this.bindLocalFunctionDeclaration(node as LocalFunctionDeclaration);
			break;
		case SyntaxKind.ClassDeclaration:
			this.bindClassDeclaration(node as ClassDeclaration);
			break;
		case SyntaxKind.TableMethod:
		case SyntaxKind.ClassMethod:
			this.bindMethod(node as TableMethod | ClassMethod);
			break;
		case SyntaxKind.TableConstructor:
		case SyntaxKind.ClassConstructor:
			this.bindConstructor(node as TableConstructor | ClassConstructor);
			break;
		case SyntaxKind.TablePropertyAssignment:
		case SyntaxKind.ClassPropertyAssignment:
			this.bindProperty(node as TablePropertyAssignment | ClassPropertyAssignment);
			break;
		case SyntaxKind.EnumDeclaration:
			this.bindEnumDeclaration(node as EnumDeclaration);
			break;
		case SyntaxKind.EnumMember:
			this.bindEnumMember(node as EnumMember);
			break;
		case SyntaxKind.TableLiteralExpression:
			this.bindAnonymousProperty(node as TableLiteralExpression, MissingSymbolName.Table, SymbolFlags.Table);
			break;
		case SyntaxKind.ClassExpression:
			this.bindAnonymousProperty(node as ClassExpression, MissingSymbolName.Class, SymbolFlags.Class);
			break;
		case SyntaxKind.FunctionExpression:
		case SyntaxKind.LambdaExpression:
			this.bindAnonymousProperty(node as FunctionExpression | LambdaExpression, MissingSymbolName.Function, SymbolFlags.Function);
			break;
		}
	}

	private bindVariableDeclaration(node: VariableDeclaration): void {
		this.createSymbol(node, node.name.value, SymbolFlags.BlockScopedVariable);
	}

	private bindParameterDeclaration(node: ParameterDeclaration): void {
		this.createSymbol(node, node.name.value, SymbolFlags.FunctionScopedVariable);
	}

	private bindConstStatement(node: ConstStatement): void {
		this.createSymbol(node, node.name.value, SymbolFlags.Global);
	}

	private bindLocalFunctionDeclaration(node: LocalFunctionDeclaration): void {
		this.createSymbol(node, node.name.value, SymbolFlags.BlockScopedVariable | SymbolFlags.Function);
	}

	private bindFunctionDeclaration(node: FunctionDeclaration): void {
		this.createSymbol(node, this.extractName(node.name) ?? MissingSymbolName.Function, SymbolFlags.Function);
	}


	private bindClassDeclaration(node: ClassDeclaration): void {
		this.createSymbol(node, this.extractName(node.name) ?? MissingSymbolName.Class, SymbolFlags.Class);
	}
	
	private bindProperty(node: ClassPropertyAssignment | TablePropertyAssignment): void {
		this.createSymbol(node, this.extractName(node.name) ?? MissingSymbolName.Property, SymbolFlags.Property);
	}

	private bindMethod(node: ClassMethod | TableMethod): void {
		this.createSymbol(node, this.extractName(node.name) ?? MissingSymbolName.Method, SymbolFlags.Method);
	}

	private bindConstructor(node: ClassConstructor | TableConstructor): void {
		this.createSymbol(node, "constructor", SymbolFlags.Constructor);
	}


	private bindEnumDeclaration(node: EnumDeclaration): void {
		this.createSymbol(node, node.name.value, SymbolFlags.Enum);
	}

	private bindEnumMember(node: EnumMember): void {
		this.createSymbol(node, this.extractName(node.name) ?? MissingSymbolName.EnumMember, SymbolFlags.EnumMember);
	}

	private bindAnonymousProperty(node: Declaration, name: string, flags: SymbolFlags) {
		const parent = node.parent!;
		switch (parent.kind) {
		case SyntaxKind.VariableDeclaration:
		case SyntaxKind.ParameterDeclaration:
		case SyntaxKind.ClassPropertyAssignment:
		case SyntaxKind.TablePropertyAssignment:
		case SyntaxKind.PostCallInitialiserPropertyAssignment:
			node.symbol = (parent as Declaration).symbol;
			return;
		default:
			this.createSymbol(node, name, flags);
		}
	}

	private getContainerFlags(node: Node): ContainerFlags {
		switch (node.kind) {
		case SyntaxKind.SourceFile:
			return ContainerFlags.IsContainer | ContainerFlags.HasLocals;
		case SyntaxKind.ClassDeclaration:
		case SyntaxKind.EnumDeclaration:
		case SyntaxKind.ClassExpression:
		case SyntaxKind.TableLiteralExpression:
			return ContainerFlags.IsContainer;
		case SyntaxKind.BlockStatement:
		case SyntaxKind.ForStatement:
		case SyntaxKind.ForEachStatement:
		case SyntaxKind.CatchClause:
		case SyntaxKind.CaseBlock:
			return ContainerFlags.IsBlockScopedContainer | ContainerFlags.HasLocals;
		case SyntaxKind.ClassMethod:
		case SyntaxKind.TableMethod:
		case SyntaxKind.ClassConstructor:
		case SyntaxKind.TableConstructor:
		case SyntaxKind.FunctionDeclaration:
		case SyntaxKind.LocalFunctionDeclaration:
		case SyntaxKind.FunctionExpression:
		case SyntaxKind.LambdaExpression:
			return ContainerFlags.IsBlockScopedContainer | ContainerFlags.HasLocals | ContainerFlags.IsFunctionLike;
		default:
			return ContainerFlags.None;
		}
	}
}