import { TERMINAL } from "../../ui/terminal";
import { interpreterState, OutputCommand } from "../core/interpreter";
import { Turtle } from "../modules/turtle";

export async function processGenerator(generator: Generator<OutputCommand, void, unknown>) {
	return new Promise<void>((resolve, reject) => {
		Turtle.reset();

		let generatorDone = false;
		let commandQueue: OutputCommand[] = [];
		let currentTimeout: ReturnType<typeof setTimeout> | null = null;
		let currentInterval: ReturnType<typeof setInterval> | null = null;
		let isSettled = false;

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
					switch (cmd.command) {
						case "forward":
							Turtle.forward(cmd.args[0] as number);
							break;
						case "backward":
							Turtle.backward(cmd.args[0] as number);
							break;
						case "right":
							Turtle.right(cmd.args[0] as number);
							break;
						case "left":
							Turtle.left(cmd.args[0] as number);
							break;
						case "penUp":
							Turtle.setPenUp();
							break;
						case "penDown":
							Turtle.setPenDown();
							break;
						case "penWidth":
							Turtle.setPenWidth(cmd.args[0] as number);
							break;
						case "enableGrid":
							Turtle.enableGrid();
							break;
						case "disableGrid":
							Turtle.disableGrid();
							break;
						case "bgColor":
							if (cmd.args.length === 3) {
								Turtle.setBgColor(cmd.args[0] as number, cmd.args[1] as number, cmd.args[2] as number);
							} else {
								Turtle.setBgColorHex(cmd.args[0] as string);
							}
							break;
						case "penColor":
							if (cmd.args.length === 3) {
								Turtle.setPenColor(cmd.args[0] as number, cmd.args[1] as number, cmd.args[2] as number);
							} else {
								Turtle.setPenColorHex(cmd.args[0] as string);
							}
							break;
						case "clear":
							Turtle.clear();
							break;
						case "home":
							Turtle.home();
							break;
						case "hideTurtle":
							Turtle.hide();
							break;
						case "showTurtle":
							Turtle.show();
							break;
					}
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
