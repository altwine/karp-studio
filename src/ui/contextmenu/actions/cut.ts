import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { EDITOR_VIEW } from "../../editor";

export async function cut() {
	const { from, to } = EDITOR_VIEW.state.selection.main;
	let text = "";
	let deleteFrom, deleteTo, newCursor: number;

	if (from === to) {
		const line = EDITOR_VIEW.state.doc.lineAt(from);
		text = line.text;
		deleteFrom = line.from;
		deleteTo = line.number < EDITOR_VIEW.state.doc.lines ? line.to + 1 : line.to;
		newCursor = Math.max(0, line.from - 1);
	} else {
		text = EDITOR_VIEW.state.sliceDoc(from, to);
		deleteFrom = from;
		deleteTo = to;
		newCursor = from;
	}

	await writeText(text);

	EDITOR_VIEW.dispatch({
		changes: { from: deleteFrom, to: deleteTo, insert: "" },
		selection: { anchor: newCursor, head: newCursor },
	});
}
