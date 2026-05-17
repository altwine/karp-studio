import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { TERMINAL_CONTAINER } from "./elements";
import { CURRENT_WINDOW } from "../core/controls";

export const TERMINAL = new Terminal({
	cursorBlink: true,
	fontFamily: '"JetBrainsMono", monospace',
	theme: {
		background: "#0d1016",
		foreground: "#bfbdb6",
		cursor: "#5ac1fe",
		cursorAccent: "#0d1016",
		black: "#0d1016",
		red: "#ef7177",
		green: "#aad84c",
		yellow: "#feb454",
		blue: "#5ac1fe",
		magenta: "#39bae5",
		cyan: "#95e5cb",
		white: "#bfbdb6",
		brightBlack: "#545557",
		brightRed: "#83353b",
		brightGreen: "#567627",
		brightYellow: "#92582b",
		brightBlue: "#27618c",
		brightMagenta: "#205a78",
		brightCyan: "#4c806f",
		brightWhite: "#fafafa",
	},
	disableStdin: true,
});

const webglAddon = new WebglAddon();
TERMINAL.loadAddon(webglAddon);

const fitAddon = new FitAddon();
TERMINAL.loadAddon(fitAddon);

TERMINAL.open(TERMINAL_CONTAINER);
fitAddon.fit();

window.addEventListener("resize", () => fitAddon.fit());
CURRENT_WINDOW.onResized(() => fitAddon.fit());
