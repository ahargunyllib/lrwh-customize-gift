import type { Position } from "../template";

export type TLineElement =
	| "line-thin"
	| "line-medium"
	| "line-thick"
	| "line-dashed"
	| "line-dotted"
	| "line-arrow"
	| "line-rounded";

export const LINE_TIP = {
	NONE: "none",
	ARROW: "arrow",
	CIRCLE: "circle",
	SQUARE: "square",
	ROUNDED: "rounded",
} as const;

export type LineTip = (typeof LINE_TIP)[keyof typeof LINE_TIP];

export interface LineElement {
	id: string;
	type: "line";
	variant: TLineElement;
	draggable?: boolean;
	strokeColor: string;
	strokeWidth: number;
	opacity: number;
	startPoint: Position;
	endPoint: Position;
	startTip?: LineTip;
	endTip?: LineTip;
	zIndex?: number;
}
