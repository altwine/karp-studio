import { mkdir, readdir, readFile, rm } from "fs/promises";
import { jsPDF } from "jspdf";
import { MdTextRender, RenderOption } from "jspdf-md-renderer";
import path from "path";

const generatePDF = async (name: string, content: string) => {
	const doc = new jsPDF({
		unit: "mm",
		format: "a4",
		orientation: "portrait",
	});

	const options: RenderOption = {
		cursor: { x: 10, y: 10 },
		page: {
			format: "a4",
			unit: "mm",
			orientation: "portrait",
			maxContentWidth: 190,
			maxContentHeight: 277,
			lineSpace: 1.5,
			defaultLineHeightFactor: 1.2,
			defaultFontSize: 12,
			defaultTitleFontSize: 14,
			topmargin: 10,
			xpading: 10,
			xmargin: 10,
			indent: 10,
		},
		font: {
			bold: { name: "JetBrainsMono", style: "normal" },
			regular: { name: "JetBrainsMono", style: "normal" },
			light: { name: "JetBrainsMono", style: "normal" },
			code: { name: "JetBrainsMono", style: "normal" },
		},
		endCursorYHandler: () => {}, // TypeError: validOptions.endCursorYHandler is not a function.
	};

	const jbMonoLightBase64 = (await readFile("./assets/JetBrainsMono-Light.ttf")).toString("base64");
	const jbMonoRegularBase64 = (await readFile("./assets/JetBrainsMono-Regular.ttf")).toString("base64");
	const jbMonoBoldBase64 = (await readFile("./assets/JetBrainsMono-Bold.ttf")).toString("base64");

	doc.addFileToVFS("JetBrainsMono-Light.ttf", jbMonoLightBase64);
	doc.addFileToVFS("JetBrainsMono-Regular.ttf", jbMonoRegularBase64);
	doc.addFileToVFS("JetBrainsMono-Bold.ttf", jbMonoBoldBase64);
	doc.addFont("JetBrainsMono-Light.ttf", "JetBrainsMono", "light");
	doc.addFont("JetBrainsMono-Regular.ttf", "JetBrainsMono", "normal");
	doc.addFont("JetBrainsMono-Bold.ttf", "JetBrainsMono", "bold");

	doc.setFont("JetBrainsMono", "normal");

	await MdTextRender(doc, content, options);
	doc.save(`./.generated/${name}.pdf`);
};

(async () => {
	await rm("./.generated", { recursive: true, force: true });
	await mkdir("./.generated", { recursive: true });

	const files = await readdir("./guides");
	for (const file of files) {
		const fileName = path.basename(file, ".md");
		const fileContent = await readFile(`./guides/${file}`, { encoding: "utf-8" });
		await generatePDF(fileName, fileContent);
	}
})();
