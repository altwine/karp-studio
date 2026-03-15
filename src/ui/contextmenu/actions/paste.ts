import { readText } from "@tauri-apps/plugin-clipboard-manager";

export async function paste(target: HTMLElement) {
	try {
		const text = await readText();

		if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
			const start = target.selectionStart!;
			const end = target.selectionEnd!;

			target.value = target.value.substring(0, start) + text + target.value.substring(end);
			target.selectionStart = start + text.length;
			target.selectionEnd = start + text.length;
			target.dispatchEvent(new Event("input", { bubbles: true }));
		}
		console.log("Paste", target);
	} catch (err) {
		console.error("Paste failed:", err);
	}
}
