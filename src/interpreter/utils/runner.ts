import { OUTPUT_CONTAINER } from "../../ui/elements";
import { OutputCommand } from "../core/interpreter";

export async function processGenerator(generator: Generator<OutputCommand, void, unknown>) {
	return new Promise<void>((resolve) => {
		function processNext() {
			const start = performance.now();

			let commandsProcessed = 0;
			let next = generator.next();

			while (!next.done && commandsProcessed < 10 && performance.now() - start < 16) {
				const cmd = next.value;
				if (cmd.type === "print") {
					OUTPUT_CONTAINER.innerHTML += cmd.args.join(" ") + "\n";
					OUTPUT_CONTAINER.scrollTop = OUTPUT_CONTAINER.scrollHeight;
				}
				commandsProcessed++;
				next = generator.next();
			}

			if (!next.done) {
				setTimeout(processNext, 0);
			} else {
				resolve();
			}
		}

		processNext();
	});
}
