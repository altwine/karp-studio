import { getCurrentWindow } from "@tauri-apps/api/window";
import { exit } from "@tauri-apps/plugin-process";
import { ICON_DOUBLE_WINDOW, ICON_SINGLE_WINDOW } from "../ui/icons";

export const CURRENT_WINDOW = getCurrentWindow();

const MINIMIZE_WINDOW_BUTTON = document.getElementById("minimizeWindow") as HTMLButtonElement;
const MAXIMIZE_WINDOW_BUTTON = document.getElementById("maximizeWindow") as HTMLButtonElement;
const CLOSE_WINDOW_BUTTON = document.getElementById("closeWindow") as HTMLButtonElement;

MINIMIZE_WINDOW_BUTTON.addEventListener("click", CURRENT_WINDOW.minimize);
CLOSE_WINDOW_BUTTON.addEventListener("click", async () => {
	if (CURRENT_WINDOW.label === "main") {
		exit(0);
	} else {
		await CURRENT_WINDOW.hide();
	}
});

CURRENT_WINDOW.onResized(async () => {
	const isMaximized = await CURRENT_WINDOW.isMaximized();
	MAXIMIZE_WINDOW_BUTTON.textContent = isMaximized ? ICON_DOUBLE_WINDOW : ICON_SINGLE_WINDOW;
});

MAXIMIZE_WINDOW_BUTTON.addEventListener("click", async () => {
	const isMaximized = await CURRENT_WINDOW.isMaximized();
	if (isMaximized) {
		CURRENT_WINDOW.unmaximize();
		MAXIMIZE_WINDOW_BUTTON.textContent = ICON_SINGLE_WINDOW;
	} else {
		CURRENT_WINDOW.maximize();
		MAXIMIZE_WINDOW_BUTTON.textContent = ICON_DOUBLE_WINDOW;
	}
});
