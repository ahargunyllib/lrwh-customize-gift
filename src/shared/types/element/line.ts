import type { Position } from "../template";

export type TLineElement =
	| "line-thin"
	| "line-medium"
	| "line-thick"
	| "line-dashed"
	| "line-dotted"
	| "line-arrow";

export interface LineElement {
	id: string;
	type: TLineElement;
	width: number;
	height: number;
	draggable?: boolean;
	position: Position;
	rotation: number;
	strokeColor: string;
	strokeWidth: number;
	opacity: number;
	startPoint: Position;
	endPoint: Position;
	startArrow?: boolean;
	endArrow?: boolean;
	startArrowSize?: number;
	endArrowSize?: number;
}
