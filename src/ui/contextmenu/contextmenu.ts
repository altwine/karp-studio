import { MAIN_WINDOW } from "../../core/controls";
import { EDITOR, CONTEXT_MENU, TITLE } from "../elements";
import { copy } from "./actions/copy";
import { cut } from "./actions/cut";
import { _delete } from "./actions/delete";
import { paste } from "./actions/paste";

let contextTarget: HTMLElement | null = null;
let contextTargetType: string | null = null;

const menuActions: Record<string, (target: HTMLElement, type: string) => Promise<void> | void> = {
	// commons
	cut,
	copy,
	paste,
	delete: _delete,

	// specifics
	"file-issue": async () => {
		alert("open github issues");
	},
	about: async () => {
		alert("open about dialog");
	},
};

function showContextMenu(e: MouseEvent, targetType: "editor" | "title") {
	e.preventDefault();
	e.stopPropagation();

	contextTarget = e.target as HTMLElement;
	contextTargetType = targetType;

	document.body.dataset.contextTarget = targetType;

	CONTEXT_MENU.style.left = `${e.clientX}px`;
	CONTEXT_MENU.style.top = `${e.clientY}px`;
	CONTEXT_MENU.classList.remove("hidden");

	const rect = CONTEXT_MENU.getBoundingClientRect();
	const overflowRight = rect.right - window.innerWidth;
	const overflowBottom = rect.bottom - window.innerHeight;

	if (overflowRight > 0) CONTEXT_MENU.style.left = `${e.clientX - overflowRight}px`;
	if (overflowBottom > 0) CONTEXT_MENU.style.top = `${e.clientY - overflowBottom}px`;
}

function hideContextMenu() {
	delete document.body.dataset.contextTarget;
	CONTEXT_MENU.classList.add("hidden");
	contextTarget = null;
	contextTargetType = null;
}

CONTEXT_MENU.addEventListener("click", async (e) => {
	e.stopPropagation();

	const item = (e.target as HTMLElement).closest(".menu-item") as HTMLElement;
	if (!item || !contextTarget || !contextTargetType) return;

	const action = item.dataset.action!;
	await menuActions[action](contextTarget, contextTargetType);
	hideContextMenu();
});

document.addEventListener("mousedown", (e) => {
	if (CONTEXT_MENU.classList.contains("hidden")) return;
	if (!CONTEXT_MENU.contains(e.target as Node)) hideContextMenu();
});

document.addEventListener("keydown", (e) => {
	if (e.key === "Escape") hideContextMenu();
});

MAIN_WINDOW.listen("tauri://blur", hideContextMenu);

EDITOR.addEventListener("contextmenu", (e) => showContextMenu(e, "editor"));
TITLE.addEventListener("contextmenu", (e) => showContextMenu(e, "title"));
