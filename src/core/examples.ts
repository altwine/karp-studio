import { ICON_EXAMPLE_1, ICON_EXAMPLE_2, ICON_EXAMPLE_3 } from "../ui/icons";
import example1 from "../../примеры/рыбалка.карп?raw";
import example2 from "../../примеры/квадрат_треугольник.карп?raw";
import example3 from "../../примеры/спираль.карп?raw";

export const EXAMPLE_CODE_SNIPPETS: Record<string, string> = {
	"рыбалка.карп": example1,
	"квадрат_треугольник.карп": example2,
	"спираль.карп": example3,
};

export const EXAMPLE_CODE_ICONS: Record<string, string> = {
	"рыбалка.карп": ICON_EXAMPLE_1,
	"квадрат_треугольник.карп": ICON_EXAMPLE_2,
	"спираль.карп": ICON_EXAMPLE_3,
};
