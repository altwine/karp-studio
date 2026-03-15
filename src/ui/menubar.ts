import { interpret } from "../interpreter/core/interpreter.ts";
import { EDITOR, REFERENCE_BUTTON, RUN_CODE_BUTTON } from "./elements.ts";

RUN_CODE_BUTTON.addEventListener("click", () => interpret(EDITOR.value));

REFERENCE_BUTTON.addEventListener("click", async () => {
	alert("open reference");
});
