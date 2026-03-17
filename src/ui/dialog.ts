import { confirm, message } from "@tauri-apps/plugin-dialog";
import { openUrl as _openUrl } from "@tauri-apps/plugin-opener";

const title = "ИСР КАРП";

export abstract class Dialog {
	static async openUrl(url: string) {
		const confirmed = await confirm(`Открыть "${url}" в браузере по умолчанию. Вы уверены?`, {
			title,
			kind: "warning",
			cancelLabel: "Нет",
			okLabel: "Да",
		});
		if (confirmed) {
			_openUrl(url);
		}
	}
	static async openInfoMessage(content: string) {
		await message(content, { title, kind: "info" });
	}
}
