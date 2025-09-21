import {
	createConnection,
	TextDocuments,
	Diagnostic,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	TextDocumentSyncKind,
	InitializeResult,
	DocumentDiagnosticReportKind,
	DocumentDiagnosticReport,
	CodeActionKind,
	DiagnosticSeverity,
	DiagnosticTag
} from 'vscode-languageserver/node';
import { Range, TextDocument } from 'vscode-languageserver-textdocument';

import { isTokenAComment, isTokenAString, isTokenTrivia, Lexer, Parser, StringToken, Token, TokenIterator, SyntaxKind, SourceFile, Binder, checkSquirrelCode } from 'squirrel';

import onHoverHandler from './onHover';
import { onCompletionHandler, onCompletionResolveHandler } from './onCompletion';
import onSignatureHelpHandler from './onSignatureHelp';
import onCodeActionHandler from './onCodeAction';
import onDocumentSymbolHandler from './onDocumentSymbol';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
export const documents = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
// let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;
	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!capabilities.workspace?.configuration;
	hasWorkspaceFolderCapability = !!capabilities.workspace?.workspaceFolders;
	// hasDiagnosticRelatedInformationCapability = !!capabilities.textDocument?.publishDiagnostics?.relatedInformation;

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				triggerCharacters: [ '.', '@', '"', '`' ],
				resolveProvider: true
			},
			hoverProvider: true,
			signatureHelpProvider: {
				triggerCharacters: [ '(', ',']
			},
			diagnosticProvider: {
				interFileDependencies: false,
				workspaceDiagnostics: false
			},
			codeActionProvider: {
				codeActionKinds: [CodeActionKind.QuickFix],
				resolveProvider: false
			},
			documentSymbolProvider: true
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

interface Settings {
	enableSignatureHelp?: boolean,
	enableDiagnostics?: boolean,
	enableCompletions?: boolean,
	enableHover?: boolean,
	completionAutoParantheses?: boolean,
}


const defaultSettings: Settings = {
	enableSignatureHelp: true,
	enableDiagnostics: true,
	enableCompletions: true,
	enableHover: true,
	completionAutoParantheses: true
};

const documentSettings = new Map<string, Thenable<Settings>>();
let globalSettings: Settings = defaultSettings;

interface DocumentInfo {
	lexer: Lexer,
	parser: Parser,
	sourceFile: SourceFile
}

export const documentInfo = new Map<string, DocumentInfo>();


export function getDocumentSettings(resource: string): Thenable<Settings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'squirrel'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		documentSettings.clear();
	} else {
		globalSettings = change.settings["squirrel"] || defaultSettings;
	}

	connection.languages.diagnostics.refresh();
});

connection.languages.diagnostics.on(async (params): Promise<DocumentDiagnosticReport> => {
	const document = documents.get(params.textDocument.uri);
	if (!document) {
		return {
			kind: DocumentDiagnosticReportKind.Full,
			items: []
		};
	}

	return {
		kind: DocumentDiagnosticReportKind.Full,
		items: await validateTextDocument(document)
	};
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	validateTextDocument(change.document);
});


documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
	documentInfo.delete(e.document.uri);
});

documents.listen(connection);

/*
connection.onDidChangeWatchedFiles(_change => {
	connection.console.log('We received a file change event');
});
*/

connection.onRequest('getToken', (params: { uri: string, offset: number }): Token<SyntaxKind> | null => {
	const info = documentInfo.get(params.uri);
	if (!info) {
		return null;
	}

	return info.lexer.findTokenAtPosition(params.offset).token;
}); 

function processLexer(document: TextDocument, lexer: Lexer, diagnostics?: Diagnostic[]) {
	const iterator = new TokenIterator(lexer.getTokens());
	while (iterator.hasNext()) {
		let token = iterator.next();
		if (!isTokenAString(token)) {
			continue;
		}

		if (token.value.toLowerCase() !== "runscriptcode") {
			continue;
		}

		do {
			token = iterator.next();
		} while (isTokenTrivia(token));

		if (token.kind === SyntaxKind.CommaToken) {
			do {
				token = iterator.next();
			} while (isTokenTrivia(token));
		}

		if (isTokenAString(token)) {
			const code = token as StringToken<typeof token.kind>;
			code.lexer = new Lexer(code.value, code.sourcePositions);

			processLexer(document, code.lexer, diagnostics);
		}
	}

	if (diagnostics === undefined) {
		return;
	}

	runParse(document, lexer, diagnostics);

	for (const error of lexer.getErrors()) {
		diagnostics.push({
			range: {
				// Conversion from 0 based offset
				start: document.positionAt(error.start),
				end: document.positionAt(error.end)
			},
			message: error.message,
			severity: error.severity,
			source: "TypeSquirrel"
		});
	}
}

async function validateTextDocument(document: TextDocument): Promise<Diagnostic[]> {
	const settings = await getDocumentSettings(document.uri);
	
	// Only run type checking for TypeSquirrel files (.tnut)
	const isTypeSquirrelFile = document.uri.endsWith('.tnut') || document.languageId === 'typesquirrel';
	
	if (!settings.enableDiagnostics) {
		return [];
	}

	const diagnostics: Diagnostic[] = [];
	
	if (isTypeSquirrelFile) {
		// Use integrated type checker for TypeSquirrel files
		const result = checkSquirrelCode(document.getText(), document.uri);
		
		// Store the parsed info for other language features
		if (result.sourceFile) {
			const lexer = new Lexer(document.getText());
			const parser = new Parser(lexer);
			const binder = new Binder();
			binder.bindSourceFile(result.sourceFile);

			documentInfo.set(document.uri, {
				lexer,
				parser,
				sourceFile: result.sourceFile
			});
		}
		
		// Convert type checker diagnostics to language server format
		for (const error of result.diagnostics) {
			diagnostics.push({
				range: {
					start: document.positionAt(error.start),
					end: document.positionAt(error.end)
				},
				message: error.message,
				severity: error.severity === 1 ? DiagnosticSeverity.Error : 
						 error.severity === 2 ? DiagnosticSeverity.Warning :
						 DiagnosticSeverity.Information,
				source: "TypeSquirrel"
			});
		}
	} else {
		// For regular Squirrel files, only do basic lexical analysis
		const lexer = new Lexer(document.getText());
		const parser = new Parser(lexer);
		const sourceFile = parser.parseSourceFile();
		const binder = new Binder();
		binder.bindSourceFile(sourceFile);

		documentInfo.set(document.uri, {
			lexer,
			parser,
			sourceFile
		});

		// Only lexical diagnostics for regular Squirrel files
		processLexer(document, lexer, diagnostics);
	}

	return diagnostics;
}

function runParse(document: TextDocument, lexer: Lexer, diagnostics: Diagnostic[]): void {
	const iterator = new TokenIterator(lexer.getTokens());
	while (iterator.hasNext()) {
		const token = iterator.next();
		if (token.kind !== SyntaxKind.IdentifierToken) {
			continue;
		}

		const lastIndex = iterator.getIndex();
		// 2 steps back because the we're on the token after the identifier, while we need a token before it
		iterator.setIndex(lastIndex - 2);
		const doc = iterator.findMethodDoc(token.value);

		iterator.setIndex(lastIndex);
		if (!doc) {
			continue;
		}

		const signature = doc.detail;
		const range: Range = {
			start: document.positionAt(token.start),
			end: document.positionAt(token.end)
		};
		
		if ("successor" in doc) {
			diagnostics.push({
				range,
				message: `'${signature}' is deprecated.`,
				severity: DiagnosticSeverity.Hint,
				tags: [DiagnosticTag.Deprecated],
				source: "TypeSquirrel"
			});
		}

		const usedParamCount = getUsedParamCount(iterator);
		if (usedParamCount === -1) {
			iterator.setIndex(lastIndex);
			continue;
		}
		iterator.setIndex(lastIndex + 1);

		const { minParamCount, maxParamCount } = getParamCount(signature);
		
		let message: string;
		if (maxParamCount === -1) {
			if (usedParamCount >= minParamCount) {
				continue;
			}

			message = `Expected at least ${minParamCount} arguments, but got ${usedParamCount}.`;
		} else {
			if (usedParamCount <= maxParamCount && usedParamCount >= minParamCount) {
				continue;
			}

			message = minParamCount === maxParamCount ?
				`Expected ${minParamCount} arguments, but got ${usedParamCount}.` :
				`Expected ${minParamCount}-${maxParamCount} arguments, but got ${usedParamCount}.`;
		}

		diagnostics.push({
			range,
			message,
			severity: DiagnosticSeverity.Error,
			source: "TypeSquirrel"
		});
	}
}

function getParamCount(signature: string): { minParamCount: number, maxParamCount: number } {
	const open = signature.indexOf('(');
	const close = signature.lastIndexOf(')');

	// If close + 2 is further than open it means we have no parameters
	// E.g GetListenServerHost() -> GetListenServerHost )( 
	if (open === -1 || close === -1 || close < open + 2) {
		return {
			minParamCount: 0,
			maxParamCount: 0
		};
	}
	
	const lexer = new Lexer(signature.slice(open + 1, close));

	let paramCount = 1;
	let defaultParamCount = 0;
	let isVariadic = false;
	for (let token = lexer.lex(); token.kind !== SyntaxKind.EndOfFileToken; token = lexer.lex()) {
		switch (token.kind) {
		case SyntaxKind.CommaToken:
			paramCount++;
			break;
		case SyntaxKind.EqualsToken:
			defaultParamCount++;
			break;
		case SyntaxKind.DotDotDotToken:
			isVariadic = true;
			break;
		}
	}

	return {
		minParamCount: paramCount - defaultParamCount - (isVariadic ? 1 : 0),
		maxParamCount: isVariadic ? -1 : paramCount
	};
}

function getUsedParamCount(iterator: TokenIterator): number {
	// Find the (
	while (iterator.hasNext()) {
		const token = iterator.next();
		if (isTokenAComment(token) || token.kind === SyntaxKind.LineFeedToken) {
			continue;
		}
		if (token.kind === SyntaxKind.OpenParenthesisToken) {
			break;
		}

		return -1;
	}
	

	let depth = 1;
	let paramCount = 0;
	let foundParam = false;
	
	while (iterator.hasNext()) {
		const token = iterator.next();
		switch (token.kind) {
		case SyntaxKind.CloseParenthesisToken:
		case SyntaxKind.CloseBraceToken:
		case SyntaxKind.CloseBracketToken:
			depth--;
			if (depth === 0) {
				return foundParam ? paramCount + 1 : 0;
			}
			break;
		case SyntaxKind.OpenParenthesisToken:
		case SyntaxKind.OpenBraceToken:
		case SyntaxKind.OpenBracketToken:
			depth++;
			break;
		case SyntaxKind.CommaToken:
			if (depth === 1) {
				paramCount++;
			}
			break;
		}

		if (!foundParam && !isTokenAComment(token) && token.kind !== SyntaxKind.LineFeedToken) {
			foundParam = true;
		}
	}

	return foundParam ? paramCount + 1 : 0;
}

connection.onCompletion(onCompletionHandler);
connection.onCompletionResolve(onCompletionResolveHandler);
connection.onHover(onHoverHandler);
connection.onSignatureHelp(onSignatureHelpHandler);
connection.onCodeAction(onCodeActionHandler);
connection.onDocumentSymbol(onDocumentSymbolHandler);
connection.listen();
