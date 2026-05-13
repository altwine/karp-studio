import { EDITOR_VIEW } from "../../editor";

export function _delete() {
	const { from, to } = EDITOR_VIEW.state.selection.main;
	let deleteFrom, deleteTo, newCursor: number;

	if (from === to) {
		const line = EDITOR_VIEW.state.doc.lineAt(from);
		deleteFrom = line.from;
		deleteTo = line.number < EDITOR_VIEW.state.doc.lines ? line.to + 1 : line.to;
		newCursor = Math.max(0, line.from - 1);
	} else {
		deleteFrom = from;
		deleteTo = to;
		newCursor = from;
	}

	EDITOR_VIEW.dispatch({
		changes: { from: deleteFrom, to: deleteTo, insert: "" },
		selection: { anchor: newCursor, head: newCursor },
	});
}
