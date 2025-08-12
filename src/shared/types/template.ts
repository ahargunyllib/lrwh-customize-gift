import type { LineElement } from "./element/line";
import type { ShapeElement } from "./element/shape";

export interface Position {
	x: number;
	y: number;
}

export interface ImageElement {
	id: string;
	type: "image";
	src: string;
	position: Position;
	width: number;
	height: number;
	draggable?: boolean;
	centerX?: boolean;
	centerY?: boolean;
	borderRadius?: number;
	grayscale?: boolean;
	zIndex?: number;
}

export interface TextElement {
	id: string;
	type: "text";
	content: string;
	position: Position;
	width: number;
	height: number;
	draggable?: boolean;
	zIndex?: number;

	style: {
		fontFamily: string;
		fontSize: string | number;
		fontWeight: string;
		color: string;
		textAlign: string;
		lineHeight: string;
		verticalAlign?: "top" | "middle" | "bottom";
		curved?: boolean;
		curveRadius?: number;
		curveDirection?: "up" | "down";
		curveIntensity?: number;
		rotate?: number;
		centerX?: boolean;
		centerY?: boolean;
		maxWidth?: number | string;
		backgroundColor?: string;
		borderRadius?: number;
		padding?: string | number;
		paddingTop?: string | number;
		paddingRight?: string | number;
		paddingBottom?: string | number;
		paddingLeft?: string | number;
		paddingX?: string | number;
		paddingY?: string | number;
		paddingCenter?: boolean;
		letterSpacing?: string | number;

		// Outline/Stroke properties
		textStroke?: string;
		WebkitTextStroke?: string;
		outlineWidth?: number;
		outlineColor?: string;
	};
}

export interface TemplateData {
	id: string;
	name: string;
	productVariantId?: string;
	width: number;
	height: number;
	backgroundColor: string;
	backgroundImage?: string;
	images: ImageElement[];
	texts: TextElement[];
	shapes: ShapeElement[];
	lines: LineElement[];
}

// export type PrintSize = "10x20" | "15x20" | "20x30";

// export interface PrintSizeConfig {
// 	name: PrintSize;
// 	width: number;
// 	height: number;
// 	label: string;
// }

export type TemplateEntity = {
	id: string;
	name: string;
	productVariantId: string;
	data: Omit<TemplateData, "id" | "name" | "productVariantId">;
};

declare module "react" {
	interface CSSProperties {
		textStroke?: string;
		WebkitTextStroke?: string;
		paintOrder?: string;
	}
}
