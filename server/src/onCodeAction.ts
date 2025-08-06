import { CodeAction, CodeActionKind, CodeActionParams, DiagnosticTag, TextEdit, WorkspaceEdit } from 'vscode-languageserver';
import { documents, getDocumentSettings, documentInfo } from './server';
import { Token, TokenIterator, SyntaxKind, globals } from 'squirrel';
import { TextDocument, Range, Position } from 'vscode-languageserver-textdocument';

export default async function onCodeActionHandler(params: CodeActionParams): Promise<CodeAction[]> {
	const document = documents.get(params.textDocument.uri);
	if (!document) {
		return [];
	}

	const settings = await getDocumentSettings(document.uri);
	if (!settings.enableCompletions) {
		return [];
	}

	const info = documentInfo.get(document.uri);
	if (!info) {
		return [];
	}
	let lexer = info.globalLexer;

	
	const fixes: CodeAction[] = [];

	const diagnostics = params.context.diagnostics;
	for (const diagnostic of diagnostics) {
		if (!diagnostic.tags?.includes(DiagnosticTag.Deprecated)) {
			continue;
		}
		
		const name = document.getText(diagnostic.range);
		const entry = globals.deprecatedMethods.get(name);
		if (!entry) {
			const entry = globals.deprecatedFunctions.get(name);
			if (!entry) {
				continue;
			}

			const result = lexer.findTokenAtPosition(document.offsetAt(diagnostic.range.end));
			lexer = result.lexer;
			
			const iterator = new TokenIterator(lexer.getTokens(), result.index);

			const param = getFirstParam(document, iterator);
			

			const edit: WorkspaceEdit = {
				changes: {
					[document.uri]: param ? [
						TextEdit.del(param.deleteRange),
						TextEdit.insert(diagnostic.range.start, param.textToKeep + '.')
					] : [
						TextEdit.insert(diagnostic.range.start, '.')
					]
				}
			};

			fixes.push({
				title: "Replace with method call",
				kind: CodeActionKind.QuickFix,
				edit,
				diagnostics: [diagnostic]
			});

			continue;

		}


		const successor = entry.successor;
		if (!successor) {
			continue;
		}

		const edits: TextEdit[] = [TextEdit.replace(diagnostic.range, successor)];

		// Yes a hardcode
		if (successor === "SetAbsAngles") {
			const tokenIndex = lexer.findTokenAtPosition(document.offsetAt(diagnostic.range.end)).index;
			const iterator = new TokenIterator(lexer.getTokens(), tokenIndex);

			const bodyRange = getCallBodyRange(document, iterator);
			if (bodyRange) {
				edits.push(TextEdit.insert(bodyRange.start, "QAngle("));
				edits.push(TextEdit.insert(bodyRange.end, ")"));
			}
		}
		

		const edit: WorkspaceEdit = {
			changes: {
				[document.uri]: edits
			}
		};

		fixes.push({
			title: `Replace with '${successor}'`,
			kind: CodeActionKind.QuickFix,
			edit,
			diagnostics: [diagnostic]
		});
	}
	return fixes;
}

function getFirstParam(document: TextDocument, iterator: TokenIterator): { deleteRange: Range, textToKeep: string } | undefined {
	let depth = 0;
	let start: Position | null = null;
	let token: Token<SyntaxKind> | null = null;
	while (iterator.hasNext()) {
		token = iterator.next();

		switch (token.kind) {
		case SyntaxKind.CloseParenthesisToken:
		case SyntaxKind.CloseBraceToken:
		case SyntaxKind.CloseBracketToken:
			depth--;
			if (depth === 0 && start) {
				const deleteRange: Range = { start, end: document.positionAt(token.start) };
				const textToKeep = document.getText(deleteRange);

				return { deleteRange, textToKeep };
			}
			break;
		case SyntaxKind.OpenBraceToken:
		case SyntaxKind.OpenBracketToken:
		case SyntaxKind.OpenParenthesisToken:
			if (depth === 0) {
				start = document.positionAt(token.end);
			}
			depth++;
			break;
		case SyntaxKind.CommaToken:
			if (start) {
				const keepRange: Range = { start, end: document.positionAt(token.start) };
				const textToKeep = document.getText(keepRange);

				token = iterator.next();
				const deleteRange: Range = { start, end: document.positionAt(token.start) };
				
				return { deleteRange, textToKeep };
			}
			break;
		case SyntaxKind.LineFeedToken:
		case SyntaxKind.LineComment:
		case SyntaxKind.BlockComment:
		case SyntaxKind.DocComment:
			continue;
		default:
			if (depth === 0) {
				return;
			}
		}
	}

	if (!start || !token) {
		return;
	}

	const deleteRange: Range = { start, end: document.positionAt(token.end) };
	const textToKeep = document.getText(deleteRange);

	return { deleteRange, textToKeep };
}

function getCallBodyRange(document: TextDocument, iterator: TokenIterator): Range | undefined {
	let depth = 0;
	let start: Position | null = null;
	let token: Token<SyntaxKind> | null = null;
	while (iterator.hasNext()) {
		token = iterator.next();

		switch (token.kind) {
		case SyntaxKind.CloseParenthesisToken:
		case SyntaxKind.CloseBraceToken:
		case SyntaxKind.CloseBracketToken:
			depth--;
			if (depth === 0 && start) {
				return { start, end: document.positionAt(token.start) };
			}
			break;
		case SyntaxKind.OpenBraceToken:
		case SyntaxKind.OpenBracketToken:
		case SyntaxKind.OpenParenthesisToken:
			if (depth === 0) {
				start = document.positionAt(token.end);
			}
			depth++;
			break;
		case SyntaxKind.LineFeedToken:
		case SyntaxKind.LineComment:
		case SyntaxKind.BlockComment:
		case SyntaxKind.DocComment:
			continue;
		default:
			if (depth === 0) {
				return;
			}
		}
	}

	if (!start || !token) {
		return;
	}

	return { start, end: document.positionAt(token.end) };
}