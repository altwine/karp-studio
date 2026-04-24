import { confirm, message } from "@tauri-apps/plugin-dialog";
import { openUrl as _openUrl, openPath } from "@tauri-apps/plugin-opener";

const TITLE = "ИСР КАРП";

export abstract class Dialog {
	static async openUrl(url: string, title: string = "") {
		const confirmed = await confirm(`Открыть "${url}" в браузере по умолчанию. Вы уверены?`, {
			title: title ? `${TITLE} - ${title}` : TITLE,
			kind: "warning",
			cancelLabel: "Нет",
			okLabel: "Да",
		});
		if (confirmed) _openUrl(url);
	}
	static async openFile(path: string, filename: string, title: string = "") {
		const confirmed = await confirm(`Открыть "${filename}" в приложении по умолчанию. Вы уверены?`, {
			title: title ? `${TITLE} - ${title}` : TITLE,
			kind: "warning",
			cancelLabel: "Нет",
			okLabel: "Да",
		});
		if (confirmed) openPath(path);
	}
	static async openInfoMessage(content: string, title: string = "") {
		await message(content, { title: title ? `${TITLE} - ${title}` : TITLE, kind: "info" });
	}
}
