import { EXAMPLE_CODE_SNIPPETS } from "../core/examples.ts";
import { EDITOR, LINE_NUMBERS, STATUS_BAR_CURSOR_POSITION } from "./elements.ts";
import { EDITOR_HISTORY } from "./keybinds.ts";

export function setEditorContent(content: string = "") {
	EDITOR.value = content;
	setTimeout(updateLineNumbers, 0);
	setTimeout(updateStatusBar, 0);
	EDITOR_HISTORY.saveState();
}

export function updateLineNumbers() {
	const lineCount = EDITOR.value.split("\n").length;
	const lineNumbersHtml = Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");
	LINE_NUMBERS.textContent = lineNumbersHtml;
	LINE_NUMBERS.scrollTop = EDITOR.scrollTop;
}

export function updateStatusBar() {
	let lines = EDITOR.value.split("\n");
	const text = EDITOR.value;
	const cursorPos = EDITOR.selectionStart;
	lines = text.split("\n");
	let line = 1;
	let col = 0;
	for (let i = 0; i < lines.length; i++) {
		const lineLength = lines[i].length;
		if (cursorPos <= col + lineLength) {
			col = cursorPos - col + 1;
			break;
		}
		col += lineLength + 1;
		line++;
	}

	STATUS_BAR_CURSOR_POSITION.textContent = `${line}:${col}`;
}

EDITOR.addEventListener("input", () => {
	EDITOR_HISTORY.saveState();
	updateLineNumbers();
	updateStatusBar();
});

EDITOR.addEventListener("click", updateStatusBar);
EDITOR.addEventListener("keyup", updateStatusBar);
EDITOR.addEventListener("select", updateStatusBar);

let scrollTimeout: number;
EDITOR.addEventListener("scroll", () => {
	cancelAnimationFrame(scrollTimeout);
	scrollTimeout = requestAnimationFrame(() => {
		LINE_NUMBERS.scrollTop = EDITOR.scrollTop;
	});
});

EDITOR.value = EXAMPLE_CODE_SNIPPETS["рыбалка.карп"];

setTimeout(updateLineNumbers, 0);
setTimeout(updateStatusBar, 0);

EDITOR_HISTORY.saveState();
