export const TITLE = document.getElementById("title") as HTMLButtonElement;

export const RUN_CODE_BUTTON = document.getElementById("runCodeButton") as HTMLButtonElement;
export const REFERENCE_BUTTON = document.getElementById("referenceButton") as HTMLButtonElement;

export const OUTPUT_CONTAINER = document.getElementById("output") as HTMLDivElement;
export const LEFT_PANEL_DIV = document.getElementById("left") as HTMLDivElement;
export const RIGHT_PANEL_DIV = document.getElementById("right") as HTMLDivElement;
export const LEFT_RESIZER = document.getElementById("resizerLeft") as HTMLDivElement;
export const RIGHT_RESIZER = document.getElementById("resizerRight") as HTMLDivElement;

export const EDITOR = document.getElementById("editor") as HTMLTextAreaElement;
export const LINE_NUMBERS = document.getElementById("lineNumbers") as HTMLDivElement;

export const CONTEXT_MENU = document.getElementById("contextMenu") as HTMLDivElement;
export const MENU_ITEM_CUT = document.querySelector('.menu-item[data-action="cut"]') as HTMLDivElement;
export const MENU_ITE_COPY = document.querySelector('.menu-item[data-action="copy"]') as HTMLDivElement;
export const MENU_ITEM_PASTE = document.querySelector('.menu-item[data-action="paste"]') as HTMLDivElement;
export const MENU_ITEM_DELETE = document.querySelector('.menu-item[data-action="delete"]') as HTMLDivElement;
export const MENU_ITEM_ABOUT = document.querySelector('.menu-item[data-action="about"]') as HTMLDivElement;
export const MENU_ITEM_FILE_ISSUE = document.querySelector('.menu-item[data-action="file-issue"]') as HTMLDivElement;
