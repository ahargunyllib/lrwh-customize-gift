import type { LineElement } from "@/shared/types/element/line";
import { v4 as uuidv4 } from "uuid";

export const getLineConfig = (variant: LineElement["variant"]): LineElement => {
	const baseLine: Omit<LineElement, "id" | "variant"> = {
		draggable: true,
		strokeColor: "#000000",
		strokeWidth: 2,
		opacity: 100,
		type: "line",
		// start and end point in center of the canvas
		startPoint: { x: 0, y: 0 },
		endPoint: { x: 50, y: 0 },
		startTip: "none",
		endTip: "none",
		zIndex: 1,
	};

	switch (variant) {
		case "line-thin":
			return { ...baseLine, id: uuidv4(), variant, strokeWidth: 1 };
		case "line-medium":
			return { ...baseLine, id: uuidv4(), variant, strokeWidth: 2 };
		case "line-thick":
			return { ...baseLine, id: uuidv4(), variant, strokeWidth: 3 };
		case "line-dashed":
			return { ...baseLine, id: uuidv4(), variant, strokeWidth: 1 };
		case "line-dotted":
			return { ...baseLine, id: uuidv4(), variant, strokeWidth: 1 };
		case "line-arrow":
			return {
				...baseLine,
				id: uuidv4(),
				variant,
				strokeWidth: 2,
				startTip: "arrow",
				endTip: "arrow",
			};
		case "line-rounded":
			return {
				...baseLine,
				id: uuidv4(),
				variant,
				strokeWidth: 2,
				startTip: "rounded",
				endTip: "rounded",
			};
		default:
			throw new Error(`Unknown line type: ${variant}`);
	}
};
