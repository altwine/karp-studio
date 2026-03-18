import { GRAPHICS_OUTPUT_CONTAINER } from "../../ui/elements";

const ctx = GRAPHICS_OUTPUT_CONTAINER.getContext("2d") as CanvasRenderingContext2D;
const CONTAINER_SIZE_X = GRAPHICS_OUTPUT_CONTAINER.width;
const CONTAINER_SIZE_Y = GRAPHICS_OUTPUT_CONTAINER.height;

let x = CONTAINER_SIZE_X / 4;
let y = CONTAINER_SIZE_Y / 4;
let angle = 0;
let penDown = true;
let penColor = "#000000";
let penWidth = 2;
let visible = true;

let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

let scale = 1.0;
const MIN_SCALE = 0.1;
const MAX_SCALE = 10.0;

let commands: { type: string; fromX: number; fromY: number; toX: number; toY: number; color: string; width: number }[] =
	[];

export const Turtle = {
	forward: (distance: number) => {
		const rad = (angle * Math.PI) / 180;
		const newX = x + distance * Math.cos(rad);
		const newY = y + distance * Math.sin(rad);

		if (penDown) {
			commands.push({
				type: "line",
				fromX: x,
				fromY: y,
				toX: newX,
				toY: newY,
				color: penColor,
				width: penWidth,
			});

			drawLineWithOffset(x, y, newX, newY);
		}

		x = newX;
		y = newY;
		if (visible) Turtle.drawTurtle();
	},

	backward: (distance: number) => {
		Turtle.forward(-distance);
	},

	right: (degrees: number) => {
		angle = (angle + degrees) % 360;
		if (visible) Turtle.drawTurtle();
	},

	left: (degrees: number) => {
		angle = (angle - degrees) % 360;
		if (visible) Turtle.drawTurtle();
	},

	setPenUp: () => {
		penDown = false;
	},

	setPenDown: () => {
		penDown = true;
	},

	setPenWidth: (width: number) => {
		if (width > 0) penWidth = width;
	},

	setPenColor: (r: number, g: number, b: number) => {
		penColor = `rgb(${r}, ${g}, ${b})`;
	},

	setPenColorHex: (color: string) => {
		penColor = color;
	},

	hide: () => {
		visible = false;
		Turtle.clearTurtle();
	},

	show: () => {
		visible = true;
		Turtle.drawTurtle();
	},

	home: () => {
		x = CONTAINER_SIZE_X / 2;
		y = CONTAINER_SIZE_Y / 2;
		angle = 0;
		if (visible) Turtle.drawTurtle();
	},

	clear: () => {
		commands = [];
		ctx.clearRect(0, 0, CONTAINER_SIZE_X, CONTAINER_SIZE_Y);
		x = CONTAINER_SIZE_X / 2;
		y = CONTAINER_SIZE_Y / 2;
		angle = 0;
		if (visible) Turtle.drawTurtle();
	},

	drawTurtle: () => {
		// TODO(altwine): implement proper turtle drawing, maybe using free icons
	},
	clearTurtle: () => {},
};

GRAPHICS_OUTPUT_CONTAINER.addEventListener("mousedown", (e) => {
	isDragging = true;
	lastMouseX = e.offsetX;
	lastMouseY = e.offsetY;
	GRAPHICS_OUTPUT_CONTAINER.style.cursor = "grabbing";
});

GRAPHICS_OUTPUT_CONTAINER.addEventListener("mousemove", (e) => {
	if (!isDragging) return;

	const dx = e.offsetX - lastMouseX;
	const dy = e.offsetY - lastMouseY;

	offsetX += dx;
	offsetY += dy;

	lastMouseX = e.offsetX;
	lastMouseY = e.offsetY;

	redrawAll();
});

GRAPHICS_OUTPUT_CONTAINER.addEventListener("mouseup", () => {
	isDragging = false;
	GRAPHICS_OUTPUT_CONTAINER.style.cursor = "default";
});

GRAPHICS_OUTPUT_CONTAINER.addEventListener("mouseleave", () => {
	isDragging = false;
	GRAPHICS_OUTPUT_CONTAINER.style.cursor = "default";
});

GRAPHICS_OUTPUT_CONTAINER.addEventListener(
	"wheel",
	(e) => {
		e.preventDefault();

		const rect = GRAPHICS_OUTPUT_CONTAINER.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;
		const delta = e.deltaY > 0 ? -0.1 : 0.1;
		let newScale = scale * (1 + delta);
		newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
		if (newScale === scale) return;
		const worldX = (mouseX - offsetX) / scale;
		const worldY = (mouseY - offsetY) / scale;
		scale = newScale;
		offsetX = mouseX - worldX * scale;
		offsetY = mouseY - worldY * scale;
		redrawAll();
	},
	{ passive: false },
);

function drawLineWithOffset(fromX: number, fromY: number, toX: number, toY: number) {
	ctx.beginPath();
	ctx.strokeStyle = penColor;
	ctx.lineWidth = penWidth;
	ctx.moveTo(fromX * scale + offsetX, fromY * scale + offsetY);
	ctx.lineTo(toX * scale + offsetX, toY * scale + offsetY);
	ctx.stroke();
}

function redrawAll() {
	ctx.clearRect(0, 0, CONTAINER_SIZE_X, CONTAINER_SIZE_Y);

	commands.forEach((cmd) => {
		ctx.beginPath();
		ctx.strokeStyle = cmd.color;
		ctx.lineWidth = cmd.width;
		ctx.moveTo(cmd.fromX * scale + offsetX, cmd.fromY * scale + offsetY);
		ctx.lineTo(cmd.toX * scale + offsetX, cmd.toY * scale + offsetY);
		ctx.stroke();
	});

	if (visible) {
		Turtle.drawTurtle();
	}
}
