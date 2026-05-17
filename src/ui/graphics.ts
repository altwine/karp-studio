import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

const webviewWindow = new WebviewWindow("graphics");

webviewWindow.onCloseRequested(async (e) => e.preventDefault());

export async function openGraphicsOutputWindow() {
	await webviewWindow.show();
}

export async function sendDrawData(data: any) {
	await webviewWindow.emit("draw-request", data);
}

export async function closeGraphicsOutputWindow() {
	await webviewWindow.hide();
}
