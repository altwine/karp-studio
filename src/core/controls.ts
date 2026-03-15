import { getCurrentWindow } from "@tauri-apps/api/window";
import { ICON_DOUBLE_WINDOW, ICON_SINGLE_WINDOW } from "../ui/icons";

const MAIN_WINDOW = getCurrentWindow();

const MINIMIZE_WINDOW_BUTTON = document.getElementById("minimizeWindow") as HTMLButtonElement;
const MAXIMIZE_WINDOW_BUTTON = document.getElementById("maximizeWindow") as HTMLButtonElement;
const CLOSE_WINDOW_BUTTON = document.getElementById("closeWindow") as HTMLButtonElement;

MINIMIZE_WINDOW_BUTTON.addEventListener("click", MAIN_WINDOW.minimize);
CLOSE_WINDOW_BUTTON.addEventListener("click", MAIN_WINDOW.close);

MAIN_WINDOW.onResized(async () => {
	const isMaximized = await MAIN_WINDOW.isMaximized();
	MAXIMIZE_WINDOW_BUTTON.textContent = isMaximized ? ICON_DOUBLE_WINDOW : ICON_SINGLE_WINDOW;
});

MAXIMIZE_WINDOW_BUTTON.addEventListener("click", async () => {
	const isMaximized = await MAIN_WINDOW.isMaximized();
	if (isMaximized) {
		MAIN_WINDOW.unmaximize();
		MAXIMIZE_WINDOW_BUTTON.textContent = ICON_SINGLE_WINDOW;
	} else {
		MAIN_WINDOW.maximize();
		MAXIMIZE_WINDOW_BUTTON.textContent = ICON_DOUBLE_WINDOW;
	}
});
