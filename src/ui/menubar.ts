import { readFile, BaseDirectory, readDir } from "@tauri-apps/plugin-fs";
import { join, resourceDir } from "@tauri-apps/api/path";
import { interpret } from "../interpreter/core/interpreter.ts";
import { showDropdown } from "./dropdown.ts";
import { EDITOR, EXAMPLES_BUTTON, REFERENCE_BUTTON, RUN_CODE_BUTTON } from "./elements.ts";
import { DROPDOWN_CONTAINER } from "../ui/elements";
import { EXAMPLE_CODE_ICONS, EXAMPLE_CODE_SNIPPETS } from "../core/examples.ts";
import { ICON_REFERENCE } from "./icons.ts";
import { openPath } from "@tauri-apps/plugin-opener";

RUN_CODE_BUTTON.addEventListener("click", () => interpret(EDITOR.value));

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

// TODO(altwine): embed pdf reader stuff maybe
REFERENCE_BUTTON.addEventListener("click", async (e) => {
	const resDir = await resourceDir();
	const guideFiles = await readDir("справка", { baseDir: BaseDirectory.Resource });
	for (const dir of guideFiles) {
		if (!dir.isFile) return;

		const fileName = dir.name;

		if (!fileName.endsWith(".pdf")) return; // TODO(altwine): replace with extname call and == check later

		const filePath = await join("справка", fileName);
		const filePath2 = await join(resDir, "справка", fileName);
		// @ts-ignore
		const fileContent = await readFile(filePath, { baseDir: BaseDirectory.Resource });

		const menuItemContainer = document.createElement("div");
		menuItemContainer.classList.add("menu-item");

		const menuItemIcon = document.createElement("i");
		menuItemIcon.classList.add("icon");
		menuItemIcon.textContent = ICON_REFERENCE;
		menuItemContainer.appendChild(menuItemIcon);

		const menuItemSpan = document.createElement("span");
		menuItemSpan.textContent = fileName;
		menuItemContainer.appendChild(menuItemSpan);

		menuItemContainer.addEventListener("click", () => openPath(filePath2));
		DROPDOWN_CONTAINER.appendChild(menuItemContainer);
	}
	showDropdown(e);
});
