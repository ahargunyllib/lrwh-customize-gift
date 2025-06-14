import type { Position } from "../template";

export type TShapeElement = "rectangle" | "circle";

export interface ShapeElement {
	id: string;
	type: TShapeElement;
	width: number;
	height: number;
	draggable?: boolean;
	position: Position;
	rotation: number;
	fill: string;
	stroke: string;
	strokeWidth: number;
	borderRadius?: number;
}
