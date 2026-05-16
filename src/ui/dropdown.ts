import { MAIN_WINDOW } from "../core/controls";
import { DROPDOWN_CONTAINER } from "./elements";

let x = 0;
let y = 0;

document.addEventListener("mousemove", (e) => {
	x = e.clientX;
	y = e.clientY;
});

export function showDropdown(e: MouseEvent) {
	e.preventDefault();
	e.stopPropagation();

	const clientX = e.clientX !== 0 ? e.clientX : x;
	const clientY = e.clientY !== 0 ? e.clientY : y;

	DROPDOWN_CONTAINER.style.left = `${clientX}px`;
	DROPDOWN_CONTAINER.style.top = `${clientY}px`;
	DROPDOWN_CONTAINER.classList.remove("hidden");
}

export function hideDropdown() {
	DROPDOWN_CONTAINER.classList.add("hidden");
	DROPDOWN_CONTAINER.replaceChildren();
}

DROPDOWN_CONTAINER.addEventListener("click", async (e) => {
	e.stopPropagation();
	const item = (e.target as HTMLElement).closest(".menu-item") as HTMLElement;
	if (!item) return;
	hideDropdown();
});

document.addEventListener("mousedown", (e) => {
	if (DROPDOWN_CONTAINER.classList.contains("hidden")) return;
	if (!DROPDOWN_CONTAINER.contains(e.target as Node)) hideDropdown();
});

document.addEventListener("keydown", (e) => {
	if (e.key === "Escape") hideDropdown();
});

MAIN_WINDOW.listen("tauri://blur", hideDropdown);
