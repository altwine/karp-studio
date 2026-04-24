import { readFile, BaseDirectory, readDir } from "@tauri-apps/plugin-fs";
import { extname, join, resourceDir } from "@tauri-apps/api/path";
import { interpret } from "../interpreter/core/interpreter.ts";
import { showDropdown } from "./dropdown.ts";
import { EDITOR, EXAMPLES_BUTTON, REFERENCE_BUTTON, RUN_CODE_BUTTON } from "./elements.ts";
import { DROPDOWN_CONTAINER } from "../ui/elements";
import { EXAMPLE_CODE_ICONS, EXAMPLE_CODE_SNIPPETS } from "../core/examples.ts";
import { ICON_REFERENCE } from "./icons.ts";
import { Dialog } from "./dialog.ts";

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
