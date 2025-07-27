import type { Position } from "../template";

export type TLineElement =
	| "line-thin"
	| "line-medium"
	| "line-thick"
	| "line-dashed"
	| "line-dotted"
	| "line-arrow";

export interface LineTip {
	type: "none" | "arrow" | "circle" | "square";
}
export interface LineElement {
	id: string;
	type: TLineElement;
	draggable?: boolean;
	strokeColor: string;
	strokeWidth: number;
	opacity: number;
	startPoint: Position;
	endPoint: Position;
	startTip?: string;
	endTip?: string;
	// startTipSize?: number;
	// endTipSize?: number;
}
