import { EXAMPLE_CODE_SNIPPETS } from "../core/examples.ts";
import { EDITOR, STATUS_BAR_CURSOR_POSITION } from "./elements.ts";
import { EditorState } from "@codemirror/state";
import {
	EditorView,
	lineNumbers,
	highlightActiveLineGutter,
	highlightSpecialChars,
	drawSelection,
	dropCursor,
	rectangularSelection,
	crosshairCursor,
	highlightActiveLine,
	keymap,
} from "@codemirror/view";
import {
	foldGutter,
	indentOnInput,
	syntaxHighlighting,
	defaultHighlightStyle,
	bracketMatching,
	foldKeymap,
} from "@codemirror/language";
import { history, defaultKeymap, historyKeymap } from "@codemirror/commands";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { closeBrackets, autocompletion, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete";
import { lintKeymap } from "@codemirror/lint";

const state = EditorState.create({
	doc: EXAMPLE_CODE_SNIPPETS["рыбалка.карп"],
	extensions: [
		lineNumbers(),
		highlightActiveLineGutter(),
		highlightSpecialChars(),
		history(),
		foldGutter(),
		drawSelection(),
		dropCursor(),
		EditorState.allowMultipleSelections.of(true),
		indentOnInput(),
		syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
		bracketMatching(),
		closeBrackets(),
		autocompletion(),
		rectangularSelection(),
		crosshairCursor(),
		highlightActiveLine(),
		highlightSelectionMatches(),
		keymap.of([
			...closeBracketsKeymap,
			...defaultKeymap,
			...searchKeymap,
			...historyKeymap,
			...foldKeymap,
			...completionKeymap,
			...lintKeymap,
		]),
		EditorView.updateListener.of((update) => {
			if (update.selectionSet || update.docChanged) {
				const { head } = update.view.state.selection.main;
				const line = update.view.state.doc.lineAt(head);
				const col = head - line.from + 1;
				STATUS_BAR_CURSOR_POSITION.textContent = `${line.number}:${col}`;
			}
		}),
		EditorView.theme({
			"&": {
				backgroundColor: "#0d1016",
				color: "#bfbdb6",
			},
			".cm-selectionBackground": {
				backgroundColor: "#1f2127bf",
			},
			".cm-activeLine": {
				backgroundColor: "#1f2127bf",
			},
			".cm-gutters": {
				backgroundColor: "#0d1016",
				color: "#4b4c4e",
				border: "none",
			},
			".cm-activeLineGutter": {
				backgroundColor: "#1a1d23",
				color: "#cbcccd",
			},
		}),
	],
});

export const EDITOR_VIEW = new EditorView({
	state: state,
	parent: EDITOR,
});

export function setEditorContent(content: string = "") {
	EDITOR_VIEW.dispatch({
		changes: {
			from: 0,
			to: EDITOR_VIEW.state.doc.length,
			insert: content,
		},
	});
}

export function getEditorContent(): string {
	return EDITOR_VIEW.state.doc.toString();
}
