import type { Position } from "../template";

export type TLineElement =
	| "line-thin"
	| "line-medium"
	| "line-thick"
	| "line-dashed"
	| "line-dotted"
	| "line-arrow"
	| "line-rounded";

export interface LineTip {
	type: "none" | "arrow" | "circle" | "square" | "rounded";
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
	zIndex?: number;
	// startTipSize?: number;
	// endTipSize?: number;
}
