import { EditHistory } from "../core/history.ts";
import { EDITOR, RUN_CODE_BUTTON } from "./elements";
import { updateLineNumbers } from "./editor.ts";

const MOD_KEY_CODES = new Set(["KeyS", "KeyP", "KeyW", "KeyN", "KeyT", "KeyF", "KeyU", "KeyA"]);
const SHIFT_MOD_KEY_CODES = new Set(["KeyI", "KeyJ", "KeyC"]);
const FUNCTION_KEYS = new Set(["F5", "F12", "F11", "Tab"]);

export const EDITOR_HISTORY = new EditHistory(EDITOR);

document.addEventListener("keydown", (e) => {
	const code = e.code;
	const mod = e.ctrlKey || e.metaKey;
	const target = e.target as HTMLElement;

	if (target.id === "editor") {
		if (mod && code === "KeyZ" && !e.shiftKey) {
			e.preventDefault();
			if (EDITOR_HISTORY.undo()) {
				updateLineNumbers();
			}
			return;
		}
		if ((mod && code === "KeyY") || (mod && e.shiftKey && code === "KeyZ")) {
			e.preventDefault();
			if (EDITOR_HISTORY.redo()) {
				updateLineNumbers();
			}
			return;
		}
		if (mod && ["KeyC", "KeyV", "KeyX", "KeyA"].includes(code)) {
			return;
		}
		if (mod) {
			e.preventDefault();
			return;
		}
	}

	if (e.repeat) return;

	if (code === "F5") {
		RUN_CODE_BUTTON.click();
		e.preventDefault();
		return;
	}

	if (FUNCTION_KEYS.has(code)) {
		e.preventDefault();
		return;
	}

	if (mod) {
		if (MOD_KEY_CODES.has(code) || (e.shiftKey && SHIFT_MOD_KEY_CODES.has(code))) {
			e.preventDefault();
			return;
		}
	}
});
