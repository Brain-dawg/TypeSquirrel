import { DocumentSymbol, DocumentSymbolParams, Range, SymbolKind } from "vscode-languageserver";
import { documentInfo, documents } from "./server";
import { TextDocument } from "vscode-languageserver-textdocument";
import { LocalsContainer, Symbol, SymbolFlags, SymbolTable } from "squirrel";

function convertOffsetsToRange(document: TextDocument, start: number, end: number): Range {
	return {
		start: document.positionAt(start),
		end: document.positionAt(end)
	};
}


export default async function onDocumentSymbolHandler(params: DocumentSymbolParams): Promise<DocumentSymbol[] | null> {
	const document = documents.get(params.textDocument.uri);
	if (!document) {
		return null;
	}

	const info = documentInfo.get(document.uri);
	if (!info) {
		return null;
	}

	const root = info.sourceFile.locals;
	if (!root) {
		return null;
	}
	
	return symbolTableToDocumentSymbols(document, root);
}


function symbolTableToDocumentSymbols(document: TextDocument, table: SymbolTable): DocumentSymbol[] {
	const result: DocumentSymbol[] = [];

	table.forEach((symbols: Symbol[]) => {
		for (const sym of symbols) {
			if (sym.flags & SymbolFlags.FunctionScopedVariable) {
				continue;
			}

			const range = convertOffsetsToRange(document, sym.declaration.start, sym.declaration.end);

			const children = [];
			const locals = (sym.declaration as LocalsContainer).locals;
			if (sym.members) {
				children.push(...symbolTableToDocumentSymbols(document, sym.members));
			}
			if (locals) {
				children.push(...symbolTableToDocumentSymbols(document, locals));
			}

			const docSym: DocumentSymbol = {
				name: sym.name,
				kind: symbolFlagsToKind(sym.flags),
				range,
				selectionRange: range,
				children
			};

			result.push(docSym);
		}
	});

	return result;
}

function symbolFlagsToKind(flags: SymbolFlags): SymbolKind {
	if (flags & (SymbolFlags.Function | SymbolFlags.Method | SymbolFlags.Constructor)) {
		return SymbolKind.Function;
	} else if (flags & SymbolFlags.Class) {
		return SymbolKind.Class;
	} else if (flags & SymbolFlags.Property) {
		return SymbolKind.Property;
	} else if (flags & SymbolFlags.Enum) {
		return SymbolKind.Enum;
	} else if (flags & SymbolFlags.EnumMember) {
		return SymbolKind.EnumMember;
	}

	return SymbolKind.Variable;
}