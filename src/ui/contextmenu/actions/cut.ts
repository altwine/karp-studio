import { writeText } from "@tauri-apps/plugin-clipboard-manager";

export async function cut(target: HTMLElement) {
	if (target instanceof HTMLTextAreaElement) {
		const start = target.selectionStart;
		const end = target.selectionEnd;

		let text = "";
		let newValue = target.value;
		let newCursorPos = start;

		if (start === end) {
			const lines = target.value.split("\n");
			let charCount = 0;
			for (let i = 0; i < lines.length; i++) {
				const lineLength = lines[i].length;
				if (start >= charCount && start <= charCount + lineLength) {
					text = lines[i];

					const beforeLine = target.value.substring(0, charCount);
					const afterLine = target.value.substring(charCount + lineLength + (i < lines.length - 1 ? 1 : 0));
					newValue = beforeLine + afterLine;

					newCursorPos = Math.max(0, charCount - 1);
					break;
				}
				charCount += lineLength + 1;
			}
		} else {
			text = target.value.substring(start, end);
			newValue = target.value.substring(0, start) + target.value.substring(end);
			newCursorPos = start;
		}

		await writeText(text);

		target.value = newValue;
		target.selectionStart = newCursorPos;
		target.selectionEnd = newCursorPos;
		target.dispatchEvent(new Event("input", { bubbles: true }));
	} else if (target instanceof HTMLInputElement) {
		const start = target.selectionStart!;
		const end = target.selectionEnd!;
		const text = target.value.substring(start, end);

		await writeText(text);

		target.value = target.value.substring(0, start) + target.value.substring(end);
		target.selectionStart = start;
		target.selectionEnd = start;
		target.dispatchEvent(new Event("input", { bubbles: true }));
	}
	console.log("Cut", target);
}
