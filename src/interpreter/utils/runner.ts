import { openGraphicsOutputWindow, sendDrawData } from "../../ui/graphics";
import { TERMINAL } from "../../ui/terminal";
import { interpreterState, OutputCommand } from "../core/interpreter";

export async function processGenerator(generator: Generator<OutputCommand, void, unknown>) {
	return new Promise<void>(async (resolve, reject) => {
		sendDrawData({ command: "reset" });

		let generatorDone = false;
		let commandQueue: OutputCommand[] = [];
		let currentTimeout: ReturnType<typeof setTimeout> | null = null;
		let currentInterval: ReturnType<typeof setInterval> | null = null;
		let isSettled = false;
		let isGraphicsOutputNeeded = false;

		function clearWaitTimeout() {
			if (currentTimeout) {
				clearTimeout(currentTimeout);
				currentTimeout = null;
			}
			if (currentInterval) {
				clearInterval(currentInterval);
				currentInterval = null;
			}
		}

		function finalize(error?: Error) {
			if (isSettled) return;
			isSettled = true;
			clearWaitTimeout();
			if (error) {
				reject(error);
			} else {
				resolve();
			}
		}

		async function processQueue() {
			const start = performance.now();

			while (commandQueue.length > 0 && performance.now() - start < 16) {
				if (!interpreterState.active) {
					finalize(new Error("Interpreter stopped"));
					return;
				}

				const cmd = commandQueue.shift()!;

				if (cmd.type === "print") {
					TERMINAL.writeln(cmd.args.join(" "));
				}

				if (cmd.type === "turtle") {
					if (!isGraphicsOutputNeeded) {
						isGraphicsOutputNeeded = true;
						await openGraphicsOutputWindow();
					}
					sendDrawData({ command: cmd.command, args: cmd.args });
				}

				if (cmd.type === "wait") {
					const waitTime = cmd.args[0] as number;

					await new Promise<void>((waitResolve) => {
						const cleanup = () => {
							if (currentTimeout) clearTimeout(currentTimeout);
							if (currentInterval) clearInterval(currentInterval);
							currentTimeout = null;
							currentInterval = null;
						};

						currentTimeout = setTimeout(() => {
							cleanup();
							waitResolve();
						}, waitTime);

						currentInterval = setInterval(() => {
							if (!interpreterState.active) {
								cleanup();
								waitResolve();
							}
						}, 25);
					});

					if (!interpreterState.active) {
						finalize(new Error("Interpreter stopped during wait"));
						return;
					}
				}
			}

			if (!generatorDone || commandQueue.length > 0) {
				setTimeout(processQueue, 0);
			} else {
				finalize();
			}
		}

		function pullCommands() {
			try {
				while (!generatorDone) {
					const next = generator.next();

					if (next.done || !interpreterState.active) {
						generatorDone = true;
						if (!interpreterState.active) {
							finalize(new Error("Interpreter stopped"));
						}
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
		}

		pullCommands();
		processQueue().catch((err) => finalize(err instanceof Error ? err : new Error(String(err))));
	});
}
