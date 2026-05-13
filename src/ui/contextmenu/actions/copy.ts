import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { EDITOR_VIEW } from "../../editor";

export async function copy() {
	const { from, to } = EDITOR_VIEW.state.selection.main;

	let text = "";

	if (from === to) {
		const line = EDITOR_VIEW.state.doc.lineAt(from);
		text = line.text;
	} else {
		text = EDITOR_VIEW.state.sliceDoc(from, to);
	}

	await writeText(text);
}
