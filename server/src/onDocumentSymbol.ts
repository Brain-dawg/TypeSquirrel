import { DocumentSymbol, DocumentSymbolParams, Range, SymbolKind } from "vscode-languageserver";
import { documentInfo, documents } from "./server";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Symbol, SymbolFlags } from "squirrel";

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

	const root = info.sourceFile.outline;
	if (!root) {
		return null;
	}
	
	return convertSymbolsToDocumentSymbols(document, root);
}


function convertSymbolsToDocumentSymbols(document: TextDocument, outline: Symbol[]): DocumentSymbol[] {
	const result: DocumentSymbol[] = [];

	for (const symbol of outline) {
		const range = convertOffsetsToRange(document, symbol.declaration.start, symbol.declaration.end);

		const documentSymbol: DocumentSymbol = {
			name: symbol.name,
			kind: symbolFlagsToKind(symbol.flags),
			range,
			selectionRange: range,
			children: symbol.outline ? convertSymbolsToDocumentSymbols(document, symbol.outline) : undefined 
		};

		result.push(documentSymbol);
	}

	return result;
}

function symbolFlagsToKind(flags: SymbolFlags): SymbolKind {
	if (flags & SymbolFlags.Function) {
		return SymbolKind.Function;
	} else if (flags & SymbolFlags.Method) {
		return SymbolKind.Method;
	} else if (flags & SymbolFlags.Constructor) {
		return SymbolKind.Constructor;
	} else if (flags & SymbolFlags.Class) {
		return SymbolKind.Class;
	} else if (flags & SymbolFlags.Property) {
		return SymbolKind.Property;
	} else if (flags & SymbolFlags.Enum) {
		return SymbolKind.Enum;
	} else if (flags & SymbolFlags.EnumMember) {
		return SymbolKind.EnumMember;
	} else if (flags & SymbolFlags.Global) {
		return SymbolKind.Field;
	}

	return SymbolKind.Variable;
}