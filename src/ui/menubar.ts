import { interpret } from "../interpreter/core/interpreter.ts";
import { showDropdown } from "./dropdown.ts";
import { EDITOR, EXAMPLES_BUTTON, REFERENCE_BUTTON, RUN_CODE_BUTTON } from "./elements.ts";
import { DROPDOWN_CONTAINER } from "../ui/elements";
import { EXAMPLE_CODE_ICONS, EXAMPLE_CODE_SNIPPETS } from "../core/examples.ts";

RUN_CODE_BUTTON.addEventListener("click", () => interpret(EDITOR.value));

EXAMPLES_BUTTON.addEventListener("click", (e) => {
	for (const name of Object.keys(EXAMPLE_CODE_ICONS)) {
		const menuItemContainer = document.createElement("div");
		menuItemContainer.classList.add("menu-item");
		menuItemContainer.dataset["name"] = `snippet-${name}`;

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

REFERENCE_BUTTON.addEventListener("click", () => {
	alert("open reference");
});
