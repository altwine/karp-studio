import { EDITOR, EXAMPLES_BUTTON, REFERENCE_BUTTON, RUN_CODE_BUTTON } from "./elements.ts";
import { EXAMPLE_CODE_ICONS, EXAMPLE_CODE_SNIPPETS } from "../core/examples.ts";
import { extname, join, resourceDir } from "@tauri-apps/api/path";
import { BaseDirectory, readDir } from "@tauri-apps/plugin-fs";
import { interpret, interpreterState } from "../interpreter/core/interpreter.ts";
import { DROPDOWN_CONTAINER } from "../ui/elements";
import { setProgressCursor } from "../ui/cursor.ts";
import { ICON_REFERENCE } from "./icons.ts";
import { showDropdown } from "./dropdown.ts";
import { Dialog } from "./dialog.ts";

const _runCodeButtonContentEl = RUN_CODE_BUTTON.querySelector("span") as HTMLSpanElement;

RUN_CODE_BUTTON.addEventListener("click", async () => {
	if (RUN_CODE_BUTTON.classList.contains("invertedVariant")) {
		interpreterState.active = false;
		return;
	}
	interpreterState.active = true;
	RUN_CODE_BUTTON.classList.add("invertedVariant");
	_runCodeButtonContentEl.textContent = "остановить";
	setProgressCursor(true);
	await interpret(EDITOR.value);
	setProgressCursor(false);
	RUN_CODE_BUTTON.classList.remove("invertedVariant");
	_runCodeButtonContentEl.textContent = "запуск";
	interpreterState.active = false;
});

EXAMPLES_BUTTON.addEventListener("click", (e) => {
	for (const name of Object.keys(EXAMPLE_CODE_ICONS)) {
		const menuItemContainer = document.createElement("div");
		menuItemContainer.classList.add("menu-item");

		const menuItemIcon = document.createElement("i");
		menuItemIcon.classList.add("icon");
		menuItemIcon.textContent = EXAMPLE_CODE_ICONS[name];
		menuItemContainer.appendChild(menuItemIcon);

		const menuItemSpan = document.createElement("span");
		menuItemSpan.textContent = name;
		menuItemContainer.appendChild(menuItemSpan);

		menuItemContainer.addEventListener("click", () => (EDITOR.value = EXAMPLE_CODE_SNIPPETS[name]));
		DROPDOWN_CONTAINER.appendChild(menuItemContainer);
	}
	showDropdown(e);
});

REFERENCE_BUTTON.addEventListener("click", async (e) => {
	const resDir = await resourceDir();
	const guideFiles = await readDir("справка", { baseDir: BaseDirectory.Resource });
	for (const dir of guideFiles) {
		if (!dir.isFile) continue;

		const fileName = dir.name;
		const fileExt = await extname(fileName);
		if (fileExt != "pdf") continue;

		const menuItemContainer = document.createElement("div");
		menuItemContainer.classList.add("menu-item");

		const menuItemIcon = document.createElement("i");
		menuItemIcon.classList.add("icon");
		menuItemIcon.textContent = ICON_REFERENCE;
		menuItemContainer.appendChild(menuItemIcon);

		const menuItemSpan = document.createElement("span");
		menuItemSpan.textContent = fileName;
		menuItemContainer.appendChild(menuItemSpan);

		const filePath = await join(resDir, "справка", fileName);
		menuItemContainer.addEventListener("click", () => Dialog.openFile(filePath, fileName));
		DROPDOWN_CONTAINER.appendChild(menuItemContainer);
	}
	showDropdown(e);
});
