import { readDir, readTextFile } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { FILE_TREE_CONTAINER, OPEN_FOLDER_BUTTON } from "./elements";
import { open } from "@tauri-apps/plugin-dialog";
import { setEditorContent } from "./editor";
import { ICON_FILE, ICON_FOLDER, ICON_FOLDER_OPEN } from "./icons";

interface TreeNode {
	name: string;
	path: string;
	isFolder: boolean;
	children?: TreeNode[] | null;
}

async function readDirectoryEntries(dirPath: string): Promise<TreeNode[]> {
	const entries = await readDir(dirPath);
	const nodes: TreeNode[] = [];

	for (const entry of entries) {
		if (entry.name.startsWith(".")) continue;

		const fullPath = await join(dirPath, entry.name);
		nodes.push({
			name: entry.name,
			path: fullPath,
			isFolder: entry.isDirectory,
			children: entry.isDirectory ? null : undefined,
		});
	}

	const sorted = nodes.sort((a, b) =>
		a.isFolder === b.isFolder ? a.name.localeCompare(b.name) : a.isFolder ? -1 : 1,
	);
	return sorted;
}

function createTreeElement(node: TreeNode): HTMLLIElement {
	const li = document.createElement("li");
	li.className = node.isFolder ? "folder" : "file";
	li.dataset.path = node.path;

	const div = document.createElement("div");
	div.className = "tree-item";
	li.appendChild(div);

	const icon = document.createElement("i");
	icon.className = "icon";
	icon.textContent = node.isFolder ? ICON_FOLDER : ICON_FILE;
	div.appendChild(icon);

	const nameSpan = document.createElement("span");
	nameSpan.className = "name";
	nameSpan.textContent = node.name;
	div.appendChild(nameSpan);

	if (node.isFolder) {
		const ul = document.createElement("ul");
		ul.classList.add("hidden");
		li.appendChild(ul);

		div.addEventListener("click", async (e) => {
			e.stopPropagation();
			const isHidden = ul.classList.contains("hidden");
			if (isHidden) {
				if (!node.children) {
					const children = await readDirectoryEntries(node.path);
					node.children = children;
					for (const child of children) {
						ul.appendChild(createTreeElement(child));
					}
				}
				ul.classList.remove("hidden");
				icon.textContent = ICON_FOLDER_OPEN;
			} else {
				ul.classList.add("hidden");
				icon.textContent = ICON_FOLDER;
			}
		});
	} else {
		div.addEventListener("click", async () => {
			const content = await readTextFile(node.path);
			setEditorContent(content);
		});
	}
	return li;
}

async function loadFileTree(rootPath: string) {
	FILE_TREE_CONTAINER.replaceChildren();
	const rootNodes = await readDirectoryEntries(rootPath);
	const rootUl = document.createElement("ul");
	rootUl.className = "file-tree";
	for (const node of rootNodes) {
		rootUl.appendChild(createTreeElement(node));
	}
	FILE_TREE_CONTAINER.appendChild(rootUl);
}

OPEN_FOLDER_BUTTON.addEventListener("click", async () => {
	const dir = await open({ directory: true, multiple: false });
	if (dir) {
		OPEN_FOLDER_BUTTON.remove();
		await loadFileTree(dir);
	}
});
