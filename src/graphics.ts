import { listen } from "@tauri-apps/api/event";

const canvas = document.querySelector("#graphics-output") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

let worldWidth: number;
let worldHeight: number;

let x: number;
let y: number;
let angle = 0;
let bgColor = "aliceblue";
let penDown = true;
let penColor = "#000000";
let penWidth = 2;
let visible = true;
let grid = false;

let offsetX = 0;
let offsetY = 0;
let scale = 1.0;
const MIN_SCALE = 0.1;
const MAX_SCALE = 10.0;

let commands: {
	type: string;
	fromX: number;
	fromY: number;
	toX: number;
	toY: number;
	color: string;
	width: number;
}[] = [];

function resizeCanvasAndAdjust() {
	const parent = canvas.parentElement;
	if (!parent) return;

	const oldWidth = canvas.width;
	const oldHeight = canvas.height;

	const newWidth = parent.clientWidth;
	const newHeight = parent.clientHeight - 36;
	if (newWidth === 0 || newHeight === 0) return;

	canvas.width = newWidth;
	canvas.height = newHeight;
	if (oldWidth > 0 && oldHeight > 0) {
		const centerWorldX = (oldWidth / 2 - offsetX) / scale;
		const centerWorldY = (oldHeight / 2 - offsetY) / scale;
		offsetX = newWidth / 2 - centerWorldX * scale;
		offsetY = newHeight / 2 - centerWorldY * scale;
	} else {
		offsetX = newWidth / 2 - (worldWidth / 2) * scale;
		offsetY = newHeight / 2 - (worldHeight / 2) * scale;
	}

	redrawAll();
}

function getGridStep(): number {
	const targetScreenSpacing = 50;
	const rawStep = targetScreenSpacing / scale;
	const niceSteps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
	let bestStep = niceSteps[0];
	let minDiff = Math.abs(rawStep - bestStep);
	for (const step of niceSteps) {
		const diff = Math.abs(rawStep - step);
		if (diff < minDiff) {
			minDiff = diff;
			bestStep = step;
		}
	}
	return bestStep;
}

function drawGrid() {
	const step = getGridStep();
	if (step <= 0) return;

	const leftWorld = -offsetX / scale;
	const rightWorld = (canvas.width - offsetX) / scale;
	const topWorld = -offsetY / scale;
	const bottomWorld = (canvas.height - offsetY) / scale;

	const startX = Math.floor(leftWorld / step) * step;
	const endX = Math.ceil(rightWorld / step) * step;
	const startY = Math.floor(topWorld / step) * step;
	const endY = Math.ceil(bottomWorld / step) * step;

	ctx.save();
	ctx.strokeStyle = "#ddd";
	ctx.lineWidth = 1;

	for (let x = startX; x <= endX; x += step) {
		const screenX = x * scale + offsetX;
		ctx.beginPath();
		ctx.moveTo(screenX, 0);
		ctx.lineTo(screenX, canvas.height);
		ctx.stroke();
	}

	for (let y = startY; y <= endY; y += step) {
		const screenY = y * scale + offsetY;
		ctx.beginPath();
		ctx.moveTo(0, screenY);
		ctx.lineTo(canvas.width, screenY);
		ctx.stroke();
	}

	ctx.restore();
}

function drawLineWithOffset(fromX: number, fromY: number, toX: number, toY: number) {
	ctx.beginPath();
	ctx.strokeStyle = penColor;
	ctx.lineWidth = penWidth;
	ctx.moveTo(fromX * scale + offsetX, fromY * scale + offsetY);
	ctx.lineTo(toX * scale + offsetX, toY * scale + offsetY);
	ctx.stroke();
}

function redrawAll() {
	canvas.style.backgroundColor = bgColor;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	if (grid) drawGrid();

	commands.forEach((cmd) => {
		ctx.beginPath();
		ctx.strokeStyle = cmd.color;
		ctx.lineWidth = cmd.width;
		ctx.moveTo(cmd.fromX * scale + offsetX, cmd.fromY * scale + offsetY);
		ctx.lineTo(cmd.toX * scale + offsetX, cmd.toY * scale + offsetY);
		ctx.stroke();
	});

	if (visible) Turtle.drawTurtle();
}

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

	backward: (distance: number) => Turtle.forward(-distance),

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

	setBgColor: (r: number, g: number, b: number) => {
		bgColor = `rgb(${r}, ${g}, ${b})`;
		canvas.style.backgroundColor = bgColor;
	},

	setBgColorHex: (color: string) => {
		bgColor = color;
		canvas.style.backgroundColor = bgColor;
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
		x = worldWidth / 2;
		y = worldHeight / 2;
		angle = 0;
		if (visible) Turtle.drawTurtle();
	},

	clear: () => {
		commands = [];
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		x = worldWidth / 2;
		y = worldHeight / 2;
		angle = 0;
		if (visible) Turtle.drawTurtle();
		if (grid) drawGrid();
	},

	enableGrid: () => {
		grid = true;
		redrawAll();
	},

	disableGrid: () => {
		grid = false;
		redrawAll();
	},

	drawTurtle: () => {
		/* ... todo */
	},

	clearTurtle: () => {
		redrawAll();
	},

	resetView: () => {
		scale = 1.0;
		offsetX = canvas.width / 2 - (worldWidth / 2) * scale;
		offsetY = canvas.height / 2 - (worldHeight / 2) * scale;
		redrawAll();
	},

	reset: () => {
		Turtle.clear();
		Turtle.setPenDown();
		Turtle.setPenColorHex("#000000");
		Turtle.setPenWidth(1);
		Turtle.show();
		Turtle.disableGrid();
		Turtle.setBgColorHex("#FFFFFF");
		Turtle.resetView();
	},
};

let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

canvas.addEventListener("mousedown", (e) => {
	isDragging = true;
	lastMouseX = e.offsetX;
	lastMouseY = e.offsetY;
	canvas.style.cursor = "grabbing";
});

canvas.addEventListener("mousemove", (e) => {
	if (!isDragging) return;

	const dx = e.offsetX - lastMouseX;
	const dy = e.offsetY - lastMouseY;

	offsetX += dx;
	offsetY += dy;

	lastMouseX = e.offsetX;
	lastMouseY = e.offsetY;

	redrawAll();
});

canvas.addEventListener("mouseup", () => {
	isDragging = false;
	canvas.style.cursor = "default";
});

canvas.addEventListener("mouseleave", () => {
	isDragging = false;
	canvas.style.cursor = "default";
});

canvas.addEventListener(
	"wheel",
	(e) => {
		e.preventDefault();

		const rect = canvas.getBoundingClientRect();
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

listen("draw-request", (data) => {
	const cmd = data.payload as any;
	switch (cmd.command) {
		case "forward":
			Turtle.forward(cmd.args[0] as number);
			break;
		case "backward":
			Turtle.backward(cmd.args[0] as number);
			break;
		case "right":
			Turtle.right(cmd.args[0] as number);
			break;
		case "left":
			Turtle.left(cmd.args[0] as number);
			break;
		case "penUp":
			Turtle.setPenUp();
			break;
		case "penDown":
			Turtle.setPenDown();
			break;
		case "penWidth":
			Turtle.setPenWidth(cmd.args[0] as number);
			break;
		case "enableGrid":
			Turtle.enableGrid();
			break;
		case "disableGrid":
			Turtle.disableGrid();
			break;
		case "bgColor":
			if (cmd.args.length === 3) {
				Turtle.setBgColor(cmd.args[0] as number, cmd.args[1] as number, cmd.args[2] as number);
			} else {
				Turtle.setBgColorHex(cmd.args[0] as string);
			}
			break;
		case "penColor":
			if (cmd.args.length === 3) {
				Turtle.setPenColor(cmd.args[0] as number, cmd.args[1] as number, cmd.args[2] as number);
			} else {
				Turtle.setPenColorHex(cmd.args[0] as string);
			}
			break;
		case "clear":
			Turtle.clear();
			break;
		case "home":
			Turtle.home();
			break;
		case "hideTurtle":
			Turtle.hide();
			break;
		case "showTurtle":
			Turtle.show();
			break;
	}
});

canvas.style.width = "100%";
canvas.style.height = "100%";
canvas.style.display = "block";

const parent = canvas.parentElement!;
const initWidth = parent.clientWidth;
const initHeight = parent.clientHeight - 36;
canvas.width = initWidth;
canvas.height = initHeight;
worldWidth = initWidth;
worldHeight = initHeight;
x = worldWidth / 2;
y = worldHeight / 2;
offsetX = canvas.width / 2 - (worldWidth / 2) * scale;
offsetY = canvas.height / 2 - (worldHeight / 2) * scale;

canvas.style.backgroundColor = bgColor;
redrawAll();

window.addEventListener("resize", () => resizeCanvasAndAdjust());
resizeCanvasAndAdjust();
