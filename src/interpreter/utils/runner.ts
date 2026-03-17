import { OUTPUT_CONTAINER } from "../../ui/elements";
import { OutputCommand } from "../core/interpreter";

export async function processGenerator(generator: Generator<OutputCommand, void, unknown>) {
	return new Promise<void>((resolve, reject) => {
		let generatorDone = false;
		let commandQueue: OutputCommand[] = [];

		function processQueue() {
			const start = performance.now();

			while (commandQueue.length > 0 && performance.now() - start < 16) {
				const cmd = commandQueue.shift()!;

				if (cmd.type === "print") {
					OUTPUT_CONTAINER.innerHTML += cmd.args.join(" ") + "\n";
					OUTPUT_CONTAINER.scrollTop = OUTPUT_CONTAINER.scrollHeight;
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
