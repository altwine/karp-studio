import { mkdir, readdir, readFile, rm } from "fs/promises";
import { jsPDF } from "jspdf";
import { MdTextRender } from "jspdf-md-renderer";
import path from "path";

const generatePDF = async (name: string, content: string) => {
	const doc = new jsPDF({
		unit: "mm",
		format: "a4",
		orientation: "portrait",
	});

	const options: any = {
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
			bold: { name: "helvetica", style: "bold" },
			regular: { name: "helvetica", style: "normal" },
			light: { name: "helvetica", style: "light" },
		},
		endCursorYHandler: () => {}, // TypeError: validOptions.endCursorYHandler is not a function.
	};

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
