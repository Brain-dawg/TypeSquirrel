import { CompletionItem, CompletionItemKind, CompletionItemTag, CompletionParams, InsertTextFormat, MarkupKind, Position, TextDocumentPositionParams, TextEdit } from 'vscode-languageserver';
import { Range, TextDocument } from 'vscode-languageserver-textdocument';
import { documents, getDocumentSettings, documentInfo } from './server';
import { Token, TokenIterator, SyntaxKind, globals, Docs, StringKind, Lexer, isTokenAString, StringToken } from 'squirrel';

const enum DocKind {
	Keywords,
	Methods,
	DeprecatedMethods,
	Functions,
	DeprecatedFunctions,
	Events,
	BuiltInConstants,
	BuiltInVariables,
	InstancesMethods,
	InstancesVariables,
	DocSnippets
}

const docKindToDocs = new Map<DocKind, Docs>([
	[DocKind.Methods, globals.methods],
	[DocKind.DeprecatedMethods, globals.deprecatedMethods],
	[DocKind.Functions, globals.functions],
	[DocKind.DeprecatedFunctions, globals.deprecatedFunctions],
	[DocKind.Events, globals.events],
	[DocKind.BuiltInConstants, globals.builtInConstants],
	[DocKind.BuiltInVariables, globals.builtInVariables],
	[DocKind.InstancesMethods, globals.otherMethods],
	[DocKind.InstancesVariables, globals.otherVariables],
	[DocKind.DocSnippets, globals.docSnippets]
]);

function convertOffsetsToRange(document: TextDocument, start: number, end: number): Range {
	return {
		start: document.positionAt(start),
		end: document.positionAt(end)
	};
}

function getQuote(document: TextDocument, token: StringToken): string {
															  // EG   |\\"|
	return document.getText(convertOffsetsToRange(document, token.start, token.sourcePositions[0]));
}

interface CompletionCache {
	searchResult: {
		token: Token | null;
		index: number;
		lexer: Lexer;
	}
	modifyRange?: Range;
}

const completionCache = new Map<string, CompletionCache>();

export async function onCompletionHandler(params: CompletionParams): Promise<CompletionItem[]> {
	const items: CompletionItem[] = [];

	const document = documents.get(params.textDocument.uri);
	if (!document) {
		return items;
	}

	const settings = await getDocumentSettings(document.uri);
	if (!settings.enableCompletions) {
		return items;
	}

	const info = documentInfo.get(document.uri);
	if (!info) {
		return items;
	}
	let lexer = info.globalLexer;
	
	const position = params.position;
	const offset = document.offsetAt(position);

	const result = lexer.findTokenAtPosition(offset - 1);
	lexer = result.lexer;


	const cache: CompletionCache = {
		searchResult: result
	};
	completionCache.set(document.uri, cache);


	const triggerChar = params.context?.triggerCharacter;
	if (result.token) {
		const token = result.token;
		if (token.kind === SyntaxKind.LineComment || token.kind === SyntaxKind.BlockComment) {
			return items;
		}

		if (token.kind === SyntaxKind.DocComment) {
			if (triggerChar !== '@') {
				return items;
			}

			addCompletionItems(document.uri, items, DocKind.DocSnippets, CompletionItemKind.Snippet);
			return items;
		}
		
		if (isTokenAString(token) && token.end !== offset) {
			if (triggerChar === '@') {
				return items;
			}

																		
			const quote = getQuote(document, token as StringToken); 
			const range = convertOffsetsToRange(document, token.start, token.end);
			const iterator = new TokenIterator(lexer.getTokens(), result.index - 1);

			if (stringCompletion(document.uri, items, range, quote, iterator)) {
				cache.modifyRange = range;

				return items;
			}
		}
	}
	// These should only work if the user writes inside a doc / string
	if (triggerChar === '@') {
		return items;
	}

	const iterator = new TokenIterator(lexer.getTokens(), result.index);

	const kind = declarationKind(iterator);
	if (kind === SyntaxKind.LocalKeyword) {
		return [{
			label: "function",
			kind: CompletionItemKind.Keyword,
			data: { uri: document.uri }
		}];
	} else if (kind === SyntaxKind.FunctionKeyword) {
		addCompletionItems(document.uri, items, DocKind.Events, CompletionItemKind.Event);
		items.push({
			label: "constructor",
			kind: CompletionItemKind.Keyword,
			data: { uri: document.uri }
		});
		return items;
	} else if (kind) {
		return items;
	}

	iterator.setIndex(result.index);

	const dotRange = getDotRange(iterator, offset);

	if (dotRange) {
		const name = iterator.readIdentity(false);
		if (name) {
			const methods = globals.instancesMethods.get(name);
			if (methods) {
				addCompletionItems(document.uri, items, DocKind.InstancesMethods, CompletionItemKind.Method, methods);
				return items;
			}

			const variables = globals.instancesVariables.get(name);
			if (variables) {
				addCompletionItems(document.uri, items, DocKind.InstancesVariables, CompletionItemKind.EnumMember, variables);
				return items;
			}

			// If we have not found this instance name in our saved completions then we assume it has every other method
			addCompletionItems(document.uri, items, DocKind.Methods, CompletionItemKind.Method);
			addCompletionItems(document.uri, items, DocKind.Events, CompletionItemKind.Event);
			addCompletionItems(document.uri, items, DocKind.DeprecatedMethods, CompletionItemKind.Method);

			return items;
		}
		// No name but a dot means that we're searching for a shortcut
		// If the last symbol was closing paranthesis it means that we have a method call which could return an entity
		// Or we've possibly done table/class accessing with []

		const lastToken = iterator.next();
		if (!lastToken || lastToken.kind !== SyntaxKind.CloseRoundToken && lastToken.kind !== SyntaxKind.RightSquareToken) {
			addCompletionItems(document.uri, items, DocKind.InstancesMethods, CompletionItemKind.Method);
			addCompletionItems(document.uri, items, DocKind.InstancesVariables, CompletionItemKind.EnumMember);
			cache.modifyRange = convertOffsetsToRange(document, dotRange.start, dotRange.end);

			return items;
		}

		addCompletionItems(document.uri, items, DocKind.Methods, CompletionItemKind.Method);
		addCompletionItems(document.uri, items, DocKind.Events, CompletionItemKind.Event);
		addCompletionItems(document.uri, items, DocKind.DeprecatedMethods, CompletionItemKind.Method);

		return items;
	}


	addCompletionItems(document.uri, items, DocKind.Functions, CompletionItemKind.Function);
	addCompletionItems(document.uri, items, DocKind.Events, CompletionItemKind.Event);
	addCompletionItems(document.uri, items, DocKind.DeprecatedFunctions, CompletionItemKind.Function);

	addCompletionItems(document.uri, items, DocKind.BuiltInConstants, CompletionItemKind.Constant);
	addCompletionItems(document.uri, items, DocKind.BuiltInVariables, CompletionItemKind.Variable);

	// It's possible to rescope your methods so that they appear as global functions
	// In this case we always stick to show available methods which are bound to instances
	addCompletionItems(document.uri, items, DocKind.InstancesMethods, CompletionItemKind.Method);
	addCompletionItems(document.uri, items, DocKind.InstancesVariables, CompletionItemKind.EnumMember);

	addPlainCompletionItems(document.uri, items, CompletionItemKind.Keyword, globals.keywords);

	return items;
}

function addPlainCompletionItems(uri: string, items: CompletionItem[], completionItemKind: CompletionItemKind, docs: Set<string>) {
	for (const item of docs) {
		items.push({
			label: item,
			kind: completionItemKind,
			data: { uri }
		});
	}
}

function addCompletionItems(uri: string, items: CompletionItem[], docKind: DocKind, completionItemKind: CompletionItemKind, docs?: Docs): void {
	if (!docs) {
		docs = docKindToDocs.get(docKind);
		if (!docs) {
			return;
		}
	}

	const tags: CompletionItemTag[] = [];
	if (docKind === DocKind.DeprecatedFunctions || docKind === DocKind.DeprecatedMethods) {
		tags.push(CompletionItemTag.Deprecated);
	}
	
	for (const label of docs.keys()) {
		items.push({
			label: label,
			kind: completionItemKind,
			tags: tags,
			data: {
				uri,
				kind: docKind
			}
		});
	}
}

function addStringCompletionItems(uri: string, items: CompletionItem[], range: Range, quote: string, kind: StringKind) {
	const docs = globals.stringCompletions[kind];
	const replacement = quote.length > 1 ? '\\\\' + quote : '\\' + quote;
	
	for (const item of docs) {
		const escaped = item.replaceAll('"', replacement);
		const text = quote + escaped + quote;
		items.push({
			label: item,
			filterText: text,
			kind: CompletionItemKind.Value,
			textEdit: TextEdit.replace(range, text),
			data: {
				uri,
				kind
			},
		});
	}
}

function stringCompletion(uri: string, items: CompletionItem[], range: Range, quote: string, iterator: TokenIterator): boolean {
	if (!iterator.hasPrevious()) {
		return false;
	}

	const token = iterator.previous();
	if (token.kind !== SyntaxKind.CommaToken) {
		if (token.kind !== SyntaxKind.OpenRoundToken) {
			return false;
		}

		const doc = iterator.findMethodDoc();
		if (!doc) {
			return false;
		}

		const stringKind = doc[0];
		if (stringKind === undefined) {
			return false;
		}

		addStringCompletionItems(uri, items, range, quote, stringKind);
		return true;
	}

	const paramCount = readParamCount(iterator);

	const doc = iterator.findMethodDoc();
	if (!doc) {
		return true;
	}	

	const stringKind = doc[paramCount + 1];
	if (stringKind === undefined) {
		return true;
	}

	addStringCompletionItems(uri, items, range, quote, stringKind);
	return true;
}

function declarationKind(iterator: TokenIterator): SyntaxKind | null {
	if (!iterator.hasPrevious()) {
		return null;
	}

	let token = iterator.previous();
	if (token.kind === SyntaxKind.LocalKeyword || token.kind === SyntaxKind.ConstKeyword || token.kind === SyntaxKind.FunctionKeyword) {
		return token.kind;
	}
	
	if (token.kind !== SyntaxKind.IdentifierToken || !iterator.hasPrevious()) {
		return null;
	}

	token = iterator.previous();

	if (token.kind === SyntaxKind.LocalKeyword || token.kind === SyntaxKind.ConstKeyword || token.kind === SyntaxKind.FunctionKeyword) {
		return token.kind;
	}

	return null;
}

function readParamCount(iterator: TokenIterator): number {
	let depth = 1;
	let paramCount = 0;
	
	while (iterator.hasPrevious()) {
		const token = iterator.previous();
		switch (token.kind) {
		case SyntaxKind.CloseRoundToken:
		case SyntaxKind.CloseCurlyToken:
		case SyntaxKind.RightSquareToken:
			depth++;
			break;
		case SyntaxKind.OpenCurlyToken:
		case SyntaxKind.OpenSquareToken:
			depth--;
			if (depth === 0) {
				return -1;
			}
			break;
		case SyntaxKind.OpenRoundToken:
			depth--;
			if (depth === 0) {
				return paramCount;
			}
			break;
		case SyntaxKind.CommaToken:
			if (depth === 1) {
				paramCount++;
			}
			break;
		}
	}

	return -1;
}

function getDotRange(iterator: TokenIterator, offset: number): { start: number, end: number } | null {
	if (!iterator.hasPrevious()) {
		return null;
	}

	let token = iterator.previous();
	if (token.kind === SyntaxKind.DotToken) {
		return { start: token.start, end: offset };
	}
	if (token.kind !== SyntaxKind.IdentifierToken) {
		return null;
	}

	if (!iterator.hasPrevious()) {
		return null;
	}

	const end = token.start;
	token = iterator.previous();
	if (token.kind === SyntaxKind.DotToken) {
		return { start: token.start, end };
	}

	return null;
}








const noSpaceKeywords = new Set<string>([
	"base",
	"break",
	"case",
	"constructor",
	"continue",
	"default",
	"false",
	"function",
	"return",
	"this",
	"true",
	"null"
]);

const paranthesisKeywords = new Set<string>([
	"if",
	"for",
	"while",
	"foreach",
	"switch",
	"function",
	"constructor"
]);

// Checks whether the function is used as a statement or as an expression
function functionParanthesis(document: TextDocument): boolean {
	const cache = completionCache.get(document.uri);
	if (!cache) {
		return false;
	}

	const { searchResult } = cache;
	const iterator = new TokenIterator(searchResult.lexer.getTokens(), searchResult.index);

	if (!iterator.hasPrevious()) {
		return false;
	}

	let token = iterator.previous();

	if (token.kind === SyntaxKind.IdentifierToken || token.kind === SyntaxKind.FunctionKeyword) {
		if (!iterator.hasPrevious()) {
			return false;
		}
		
		token = iterator.previous();
	}

	if (token.kind === SyntaxKind.LocalKeyword) {
		if (!iterator.hasPrevious()) {
			return false;
		}
		
		token = iterator.previous();
	}

	if (token.kind === SyntaxKind.SemicolonToken || token.kind === SyntaxKind.LineFeedToken) {
		return false;
	}

	return true;
}

export async function onCompletionResolveHandler(item: CompletionItem): Promise<CompletionItem> {
	const document = documents.get(item.data.uri);
	if (!document) {
		return item;
	}

	if (item.kind === CompletionItemKind.Keyword) {
		item.insertText = item.label;
		if (!noSpaceKeywords.has(item.label)) {
			item.insertText += " ";
		}
		
		if (item.label === "function" && !functionParanthesis(document)) {
			item.insertText += " ";
			item.command = {
				title: "Trigger Suggest",
    			command: "editor.action.triggerSuggest"
			};

			return item;
		}

		const settings = await getDocumentSettings(document.uri);
		if (settings.completionAutoParantheses && paranthesisKeywords.has(item.label)) {
			item.insertText += "($0)";
			item.insertTextFormat = InsertTextFormat.Snippet;
		}

		return item;
	}

	if (item.kind === CompletionItemKind.Value) {
		if (!StringKind[item.data.kind].endsWith("PROPERTY")) {
			return item;
		}
		
		let snippet_id = 1;
		let text = item.textEdit!.newText.replace(/\d+/g, (match) => {
			return `\${${snippet_id++}:${match}}`;
		});

		if (snippet_id === 1) {
			return item;
		}
		
		item.insertTextFormat = InsertTextFormat.Snippet;
		item.textEdit!.newText = text + "$0";
		return item;
	}

	const doc = docKindToDocs.get(item.data.kind)?.get(item.label);
	if (!doc) {
		return item;
	}

	item.detail = doc.detail;
	if (doc.desc) {
		item.documentation = {
			kind: MarkupKind.Markdown,
			value: doc.desc
		};
	}

	if (item.kind === CompletionItemKind.Snippet && doc.snippet) {
		item.insertText = item.label + " " + doc.snippet;
		item.insertTextFormat = InsertTextFormat.Snippet;
		return item;
	}

	const dotRange = completionCache.get(document.uri)!.modifyRange;
	if (dotRange) {
		item.additionalTextEdits = [
			TextEdit.insert(dotRange.start, doc.append!),
			TextEdit.del(dotRange),
		];
	}

	const settings = await getDocumentSettings(document.uri);
	if (!settings.completionAutoParantheses ||
		item.kind !== CompletionItemKind.Function &&
		item.kind !== CompletionItemKind.Method
	) {
		return item;
	}
	
	const open = item.detail.indexOf('(');
	const close = item.detail.lastIndexOf(')');
	// If close + 2 is further than open it means we have no parameters
	// E.g GetListenServerHost() -> GetListenServerHost )( 
	if (close < open + 2) {
		item.insertText = item.label + "()";
		return item;
	}

	item.insertText = item.label + "($0)";
	item.insertTextFormat = InsertTextFormat.Snippet;
	item.command = {
		title: "Trigger Parameter Hints",
		command: "editor.action.triggerParameterHints"
	};

	return item;
}