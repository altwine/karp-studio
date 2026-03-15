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

const MOD_KEYS = new Set(["s", "p", "w", "n", "t", "f", "u", "a"]);
const SHIFT_MOD_KEYS = new Set(["i", "j", "c"]);
const FUNCTION_KEYS = new Set(["f5", "f12", "f11", "tab"]);

document.addEventListener("keydown", (e) => {
	const key = e.key.toLowerCase();
	const mod = e.ctrlKey || e.metaKey;
	const target = e.target as HTMLElement;

	if (target.id === "editor") {
		if (mod && key === "z" && !e.shiftKey) {
			e.preventDefault();
			if (editorHistory.undo()) {
				updateLineNumbers();
			}
			return;
		}
		if ((mod && key === "y") || (mod && e.shiftKey && key === "z")) {
			e.preventDefault();
			if (editorHistory.redo()) {
				updateLineNumbers();
			}
			return;
		}
		if (mod && ["c", "v", "x", "a"].includes(key)) {
			return;
		}
		if (mod) {
			e.preventDefault();
			return;
		}
	}

	if (e.repeat) return;

	if (key === "f5") {
		interpret(EDITOR.value);
		e.preventDefault();
		return;
	}

	if (FUNCTION_KEYS.has(key)) {
		e.preventDefault();
		return;
	}

	if (mod) {
		if (MOD_KEYS.has(key) || (e.shiftKey && SHIFT_MOD_KEYS.has(key))) {
			e.preventDefault();
			return;
		}
	}
});

editorHistory.saveState();
