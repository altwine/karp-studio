const PROGRESS_CLASS = "global-progress-cursor";

export function setProgressCursor(on: boolean) {
	if (on) {
		document.documentElement.classList.add(PROGRESS_CLASS);
	} else {
		document.documentElement.classList.remove(PROGRESS_CLASS);
	}
}
