import { LEFT_PANEL_DIV, LEFT_RESIZER } from "./elements";

const MIN_WIDTH = 150;
const MAX_WIDTH = 480;

let currentResizer: HTMLElement | null = null;
let startX = 0;
let startLeftWidth = 0;

function onMouseDown(e: MouseEvent) {
	const target = e.target as HTMLElement;
	if (target !== LEFT_RESIZER) return;

	currentResizer = target;
	startX = e.clientX;

	startLeftWidth = LEFT_PANEL_DIV.offsetWidth;

	document.addEventListener("mousemove", onMouseMove);
	document.addEventListener("mouseup", onMouseUp);

	e.preventDefault();
}

function onMouseMove(e: MouseEvent) {
	if (!currentResizer) return;

	const dx = e.clientX - startX;

	if (currentResizer === LEFT_RESIZER) {
		const newLeftWidth = startLeftWidth + dx;
		if (newLeftWidth >= MIN_WIDTH && newLeftWidth <= MAX_WIDTH) {
			LEFT_PANEL_DIV.style.width = `${newLeftWidth}px`;
		}
	}
}

function onMouseUp() {
	if (currentResizer) {
		currentResizer = null;
	}

	document.removeEventListener("mousemove", onMouseMove);
	document.removeEventListener("mouseup", onMouseUp);
}

LEFT_RESIZER.addEventListener("mousedown", onMouseDown);
LEFT_RESIZER.addEventListener("dblclick", () => (LEFT_PANEL_DIV.style.width = "240px"));
