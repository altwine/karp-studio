export class EditHistory {
	private undoStack: string[] = [];
	private redoStack: string[] = [];
	private maxSize: number = 100;
	private isApplyingHistory = false;

	constructor(private textarea: HTMLTextAreaElement) {}

	saveState() {
		if (this.isApplyingHistory) return;

		const currentValue = this.textarea.value;
		const lastState = this.undoStack[this.undoStack.length - 1];

		if (lastState !== currentValue) {
			this.undoStack.push(currentValue);
			this.redoStack = [];

			if (this.undoStack.length > this.maxSize) {
				this.undoStack.shift();
			}
		}
	}

	undo(): boolean {
		if (this.undoStack.length === 0) return false;

		const currentValue = this.textarea.value;
		const previousValue = this.undoStack.pop()!;

		this.redoStack.push(currentValue);

		this.isApplyingHistory = true;
		this.textarea.value = previousValue;
		this.isApplyingHistory = false;

		return true;
	}

	redo(): boolean {
		if (this.redoStack.length === 0) return false;

		const nextValue = this.redoStack.pop()!;
		const currentValue = this.textarea.value;

		this.undoStack.push(currentValue);

		this.isApplyingHistory = true;
		this.textarea.value = nextValue;
		this.isApplyingHistory = false;

		return true;
	}

	clear() {
		this.undoStack = [];
		this.redoStack = [];
	}
}
