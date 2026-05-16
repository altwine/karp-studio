import { REFERENCE_BUTTON, RUN_CODE_BUTTON } from "./elements";

const MOD_KEY_CODES = new Set(["KeyS", "KeyP", "KeyW", "KeyN", "KeyT", "KeyF", "KeyU", "KeyA"]);
const SHIFT_MOD_KEY_CODES = new Set(["KeyI", "KeyJ", "KeyC"]);
const FUNCTION_KEYS = new Set(["F5", "F12", "F11", "Tab"]);

document.addEventListener("keydown", (e) => {
	if (e.repeat) return;

	const code = e.code;
	const mod = e.ctrlKey || e.metaKey;

	if (code === "F5") {
		RUN_CODE_BUTTON.click();
		e.preventDefault();
		return;
	}

	if (code === "F1") {
		REFERENCE_BUTTON.click();
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
