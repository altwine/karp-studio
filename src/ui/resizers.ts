import { LEFT_PANEL_DIV, LEFT_RESIZER, RIGHT_PANEL_DIV, RIGHT_RESIZER } from "./elements";

const MIN_WIDTH = 150;
const MAX_WIDTH = 400;

let currentResizer: HTMLElement | null = null;
let startX = 0;
let startLeftWidth = 0;
let startRightWidth = 0;

function onMouseDown(e: MouseEvent) {
	const target = e.target as HTMLElement;
	if (target !== LEFT_RESIZER && target !== RIGHT_RESIZER) return;

	currentResizer = target;
	startX = e.clientX;

	startLeftWidth = LEFT_PANEL_DIV.offsetWidth;
	startRightWidth = RIGHT_PANEL_DIV.offsetWidth;

	currentResizer.classList.add("resizing");

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
	} else if (currentResizer === RIGHT_RESIZER) {
		const newRightWidth = startRightWidth - dx;
		if (newRightWidth >= MIN_WIDTH && newRightWidth <= MAX_WIDTH) {
			RIGHT_PANEL_DIV.style.width = `${newRightWidth}px`;
		}
	}
}

function onMouseUp() {
	if (currentResizer) {
		currentResizer.classList.remove("resizing");
		currentResizer = null;
	}

	document.removeEventListener("mousemove", onMouseMove);
	document.removeEventListener("mouseup", onMouseUp);
}

LEFT_RESIZER.addEventListener("mousedown", onMouseDown);
RIGHT_RESIZER.addEventListener("mousedown", onMouseDown);
