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
}

export interface TextElement {
	id: string;
	type: "text";
	content: string;
	position: Position;
	draggable?: boolean;
	style: {
		fontFamily: string;
		fontSize: string;
		fontWeight: string;
		color: string;
		textAlign: string;
		lineHeight: string;
		curved?: boolean;
		curveRadius?: number;
		curveDirection?: "up" | "down";
		rotate?: number;
		centerX?: boolean;
		centerY?: boolean;
		maxWidth?: number | string;
		backgroundColor?: string;
		borderRadius?: number;
		height?: number;
		padding?: string | number;
		paddingTop?: string | number;
		paddingRight?: string | number;
		paddingBottom?: string | number;
		paddingLeft?: string | number;
		paddingX?: string | number;
		paddingY?: string | number;
		paddingCenter?: boolean;
		letterSpacing?: string | number;
	};
}

export interface TemplateData {
	id: string;
	name: string;
	width: number;
	height: number;
	backgroundColor: string;
	backgroundImage?: string;
	images: ImageElement[];
	texts: TextElement[];
}

export type PrintSize = "10x20" | "15x20" | "20x30";

export interface PrintSizeConfig {
	name: PrintSize;
	width: number;
	height: number;
	label: string;
}

export type TemplateEntity = {
	id: string;
	name: string;
	data: Omit<TemplateData, "id" | "name">;
};
