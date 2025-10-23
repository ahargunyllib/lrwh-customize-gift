import type { Position } from "../template";

export type TShapeElement = "rectangle" | "circle" | "triangle";

export interface ShapeElement {
	id: string;
	type: "shape";
	variant: TShapeElement;
	width: number;
	height: number;
	draggable?: boolean;
	position: Position;
	rotation: number;
	fill: string;
	borderColor: string;
	borderWidth: number;
	borderRadius: number;
	opacity: number;
	zIndex: number;
}
