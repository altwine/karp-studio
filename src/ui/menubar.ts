import { EXAMPLE_CODE_SNIPPETS } from "../core/examples.ts";
import { interpret } from "../interpreter/core/interpreter.ts";
import { EDITOR, EXAMPLES_BUTTON, REFERENCE_BUTTON, RUN_CODE_BUTTON } from "./elements.ts";

RUN_CODE_BUTTON.addEventListener("click", () => interpret(EDITOR.value));

const exampleNames = Object.keys(EXAMPLE_CODE_SNIPPETS);
let lastExampleIdx = 0;

EXAMPLES_BUTTON.addEventListener("click", () => {
	let randExampleIdx;
	do {
		randExampleIdx = Math.floor(Math.random() * exampleNames.length);
	} while (randExampleIdx === lastExampleIdx);

	const exampleName = exampleNames[randExampleIdx];
	const exampleCode = (EXAMPLE_CODE_SNIPPETS as any)[exampleName];
	EDITOR.value = `# ${exampleName}\n\n${exampleCode}`;
	lastExampleIdx = randExampleIdx;
});

REFERENCE_BUTTON.addEventListener("click", () => {
	alert("open reference");
});
