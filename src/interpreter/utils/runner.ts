import { TEXT_OUTPUT_CONTAINER } from "../../ui/elements";
import { OutputCommand } from "../core/interpreter";
import { Turtle } from "../modules/turtle";

export async function processGenerator(generator: Generator<OutputCommand, void, unknown>) {
	return new Promise<void>((resolve, reject) => {
		let generatorDone = false;
		let commandQueue: OutputCommand[] = [];

		function processQueue() {
			const start = performance.now();

			while (commandQueue.length > 0 && performance.now() - start < 16) {
				const cmd = commandQueue.shift()!;

				if (cmd.type === "print") {
					TEXT_OUTPUT_CONTAINER.innerHTML += cmd.args.join(" ") + "\n";
					TEXT_OUTPUT_CONTAINER.scrollTop = TEXT_OUTPUT_CONTAINER.scrollHeight;
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
			}

			if (!generatorDone || commandQueue.length > 0) {
				setTimeout(processQueue, 0);
			} else {
				resolve();
			}
		}

		function pullCommands() {
			try {
				while (!generatorDone) {
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
				reject(e);
			}
		}

		pullCommands();
		processQueue();
	});
}
