import { openGraphicsOutputWindow } from "../../ui/graphics";
import { TERMINAL } from "../../ui/terminal";
import { interpreterState, OutputCommand } from "../core/interpreter";
import { emit, listen } from "@tauri-apps/api/event";

let commandId = 0;
let ackListeners = new Map<number, (status: string) => void>();

listen("draw-response", (event) => {
	const { _id, status } = event.payload as any;
	const handler = ackListeners.get(_id);
	if (handler) {
		handler(status);
		ackListeners.delete(_id);
	}
});

async function sendDrawDataWithAck(data: any, id: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			return reject(new Error("Interpreter stopped"));
		}
		const timeout = setTimeout(() => {
			if (ackListeners.has(id)) {
				ackListeners.delete(id);
				reject(new Error(`Timeout waiting for draw-response for command ${id}`));
			}
		}, 100);
		const handler = (status: string) => {
			clearTimeout(timeout);
			if (signal) signal.removeEventListener("abort", onAbort);
			if (status === "ok") resolve();
			else reject(new Error(`Command ${id} failed: ${status}`));
		};
		const onAbort = () => {
			clearTimeout(timeout);
			ackListeners.delete(id);
			reject(new Error("Interpreter stopped"));
		};
		ackListeners.set(id, handler);
		if (signal) signal.addEventListener("abort", onAbort, { once: true });
		emit("draw-request", { ...data, _id: id }).catch((err) => {
			clearTimeout(timeout);
			ackListeners.delete(id);
			if (signal) signal.removeEventListener("abort", onAbort);
			reject(err);
		});
	});
}

export async function processGenerator(generator: Generator<OutputCommand, void, unknown>) {
	return new Promise<void>(async (resolve, reject) => {
		await sendDrawDataWithAck({ command: "reset" }, commandId++);
		let generatorDone = false;
		let commandQueue: OutputCommand[] = [];
		let isProcessing = false;
		let isSettled = false;

		function finalize(error?: Error) {
			if (isSettled) return;
			isSettled = true;
			if (error) reject(error);
			else resolve();
		}

		function waitForActiveFalse(): Promise<never> {
			return new Promise((_, reject) => {
				const check = setInterval(() => {
					if (!interpreterState.active) {
						clearInterval(check);
						reject(new Error("Interpreter stopped"));
					}
				}, 10);
			});
		}

		async function processQueue() {
			if (isProcessing) return;
			isProcessing = true;
			while (commandQueue.length > 0 && interpreterState.active) {
				const cmd = commandQueue.shift()!;
				if (cmd.type === "print") {
					TERMINAL.writeln(cmd.args.join(" "));
					continue;
				}
				if (cmd.type === "turtle") {
					await Promise.race([openGraphicsOutputWindow(), waitForActiveFalse()]);
					const controller = new AbortController();
					const checkActive = setInterval(() => {
						if (!interpreterState.active) controller.abort();
					}, 10);
					try {
						await sendDrawDataWithAck(
							{ command: cmd.command, args: cmd.args },
							commandId++,
							controller.signal,
						);
					} finally {
						clearInterval(checkActive);
					}
				}
				if (cmd.type === "wait") {
					const waitTime = cmd.args[0] as number;
					let timeoutId: ReturnType<typeof setTimeout> | null = null;
					let intervalId: ReturnType<typeof setInterval> | null = null;
					await new Promise<void>((resolveWait) => {
						const cleanup = () => {
							if (timeoutId) clearTimeout(timeoutId);
							if (intervalId) clearInterval(intervalId);
							timeoutId = null;
							intervalId = null;
						};
						timeoutId = setTimeout(() => {
							cleanup();
							resolveWait();
						}, waitTime);
						intervalId = setInterval(() => {
							if (!interpreterState.active) {
								cleanup();
								resolveWait();
							}
						}, 25);
					});
					if (!interpreterState.active) {
						finalize(new Error("Interpreter stopped during wait"));
						return;
					}
				}
			}
			isProcessing = false;
			if (!interpreterState.active) {
				finalize(new Error("Interpreter stopped"));
				return;
			}
			if (!generatorDone && commandQueue.length === 0) {
				setTimeout(processQueue, 0);
			} else if (generatorDone && commandQueue.length === 0) {
				finalize();
			} else if (interpreterState.active) {
				setTimeout(processQueue, 0);
			}
		}

		function pullCommands() {
			try {
				while (!generatorDone && interpreterState.active) {
					const next = generator.next();
					if (next.done) {
						generatorDone = true;
						break;
					}
					commandQueue.push(next.value);
					if (commandQueue.length > 50) {
						setTimeout(pullCommands, 0);
						return;
					}
				}
			} catch (e) {
				finalize(e instanceof Error ? e : new Error(String(e)));
			}
			if (generatorDone && !isProcessing && commandQueue.length > 0) {
				processQueue().catch(finalize);
			}
		}

		pullCommands();
		processQueue().catch(finalize);
	});
}
