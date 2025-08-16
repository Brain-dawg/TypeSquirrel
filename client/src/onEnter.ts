import { StringToken, Token, SyntaxKind, StringTokenKind } from 'squirrel';
import { Position, Range, Selection, TextDocument, window } from 'vscode';

function convertOffsetsToRange(document: TextDocument, start: number, end: number): Range {
	return new Range(document.positionAt(start), document.positionAt(end));
}

function getQuote(document: TextDocument, token: StringToken<StringTokenKind>): string {
	return document.getText(convertOffsetsToRange(document, token.start, token.sourcePositions[0]));
}

export default async function onEnterHandler(document: TextDocument, offset: number, indent: string, token: Token<SyntaxKind>) {
	const editor = window.activeTextEditor;
	if (!editor) {
		return;
	}

	// position before pressing enter
	const previousPosition = document.positionAt(offset);
	const line = previousPosition.line;
	// position after pressing enter
	const newLineEncodingLength = indent.startsWith('\r') ? 2 : 1;
	const currentPosition = new Position(line + 1, indent.length - newLineEncodingLength);

	if (token.kind === SyntaxKind.StringToken) {
		if (!isEnclosed(token, offset, -1)) {
			return;
		}

		const quote = getQuote(document, token as StringToken<typeof token.kind>);

		await editor.edit(editBuilder => {
			editBuilder.insert(previousPosition, quote + ' +');
			editBuilder.insert(currentPosition, quote);
		});
		
		return;
	}

	if (token.kind === SyntaxKind.DocComment) {
		if (!isEnclosed(token, offset, 3)) {
			return;
		}

		const beforeText = document.getText(new Range(new Position(line, 0), previousPosition));
		// If we do not have a start to the left of the cursor we want to have lines without inserting *
		const hasStar = beforeText.trimStart().startsWith('*');

		if (isClosed(token as Token<SyntaxKind.DocComment>)) {
			if (!isEnclosed(token, offset, -2)) {
				return;
			}

			const atStart = document.positionAt(token.start).line === line;
			if (!atStart && !hasStar) {
				return;
			}
			await editor.edit(editBuilder => {
				editBuilder.insert(currentPosition, atStart ? " * " : "* ");
			});
			return;
		}

		await editor.edit(editBuilder => {
			editBuilder.insert(currentPosition, (hasStar ? `* ${indent}*/` : ` * ${indent} */`));
		});
		const newPosition = currentPosition.translate(0, 3);
		editor.selection = new Selection(newPosition, newPosition);

		return;
	}

	if (token.kind === SyntaxKind.BlockComment) {
		// In case we were on the left of the token
		if (!isEnclosed(token, offset, 2)) {
			return;
		}

		if (isClosed(token as Token<SyntaxKind.BlockComment>)) {
			return;
		}


		await editor.edit(editBuilder => {
			editBuilder.insert(currentPosition, `${indent} */`);
		});
		editor.selection = new Selection(currentPosition, currentPosition);

		return;
	}
};


// Checks how deep the cursor is inside the token, positive numbers to check from the left, negative for the right
function isEnclosed(token: Token<SyntaxKind>, offset: number, number: number) {
	if (number > 0) {
		return token.start + number <= offset;
	}
	return token.end + number >= offset;
}

function isClosed(token: Token<SyntaxKind.BlockComment | SyntaxKind.DocComment>) {
	// Cutting the starting /*
	// If we have another /* in the comment's body, it means that we're trying to make a new comment on top of another comment
	if (token.value.slice(2).includes("/*")) {
		return false;
	}

	return token.value.slice(token.value.length - 2) === "*/";
}
