import { readText } from "@tauri-apps/plugin-clipboard-manager";
import { EDITOR_VIEW } from "../../editor";

export async function paste() {
	const text = await readText();
	const { from, to } = EDITOR_VIEW.state.selection.main;

	EDITOR_VIEW.dispatch({
		changes: { from, to, insert: text },
		selection: { anchor: from + text.length },
	});
}
