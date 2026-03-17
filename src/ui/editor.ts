import { interpret } from "../interpreter/core/interpreter.ts";
import { EDITOR, LINE_NUMBERS } from "./elements.ts";
import { EditHistory } from "../core/history.ts";

import exampleCode from "../../примеры/рыбалка.карп?raw";

const editorHistory = new EditHistory(EDITOR);

function updateLineNumbers() {
	const lineCount = EDITOR.value.split("\n").length;
	const lineNumbersHtml = Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");
	LINE_NUMBERS.textContent = lineNumbersHtml;
	LINE_NUMBERS.scrollTop = EDITOR.scrollTop;
}

EDITOR.addEventListener("input", () => {
	editorHistory.saveState();
	updateLineNumbers();
});

let scrollTimeout: number;
EDITOR.addEventListener("scroll", () => {
	cancelAnimationFrame(scrollTimeout);
	scrollTimeout = requestAnimationFrame(() => {
		LINE_NUMBERS.scrollTop = EDITOR.scrollTop;
	});
});

EDITOR.value = exampleCode;

setTimeout(updateLineNumbers, 0);

const MOD_KEY_CODES = new Set(["KeyS", "KeyP", "KeyW", "KeyN", "KeyT", "KeyF", "KeyU", "KeyA"]);
const SHIFT_MOD_KEY_CODES = new Set(["KeyI", "KeyJ", "KeyC"]);
const FUNCTION_KEYS = new Set(["F5", "F12", "F11", "Tab"]);

document.addEventListener("keydown", (e) => {
	const code = e.code;
	const mod = e.ctrlKey || e.metaKey;
	const target = e.target as HTMLElement;

	if (target.id === "editor") {
		if (mod && code === "KeyZ" && !e.shiftKey) {
			e.preventDefault();
			if (editorHistory.undo()) {
				updateLineNumbers();
			}
			return;
		}
		if ((mod && code === "KeyY") || (mod && e.shiftKey && code === "KeyZ")) {
			e.preventDefault();
			if (editorHistory.redo()) {
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
		interpret(EDITOR.value);
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

editorHistory.saveState();
