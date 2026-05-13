import { EXAMPLE_CODE_SNIPPETS } from "../core/examples.ts";
import { EDITOR, STATUS_BAR_CURSOR_POSITION } from "./elements.ts";

import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { basicSetup } from "codemirror";

const state = EditorState.create({
	doc: EXAMPLE_CODE_SNIPPETS["рыбалка.карп"],
	extensions: [
		basicSetup,
		EditorView.updateListener.of((update) => {
			if (update.selectionSet || update.docChanged) {
				const { head } = update.view.state.selection.main;
				const line = update.view.state.doc.lineAt(head);
				const col = head - line.from + 1;
				STATUS_BAR_CURSOR_POSITION.textContent = `${line.number}:${col}`;
			}
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
