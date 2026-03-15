import { writeText } from "@tauri-apps/plugin-clipboard-manager";

export async function copy(target: HTMLElement) {
	if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
		const start = target.selectionStart!;
		const end = target.selectionEnd!;

		let text = "";
		if (start === end) {
			const lines = target.value.split("\n");
			let charCount = 0;
			for (let i = 0; i < lines.length; i++) {
				const lineLength = lines[i].length;
				if (start >= charCount && start <= charCount + lineLength) {
					text = lines[i];
					break;
				}
				charCount += lineLength + 1;
			}
		} else {
			text = target.value.substring(start, end);
		}

		await writeText(text);
	}
	console.log("Copy", target);
}
