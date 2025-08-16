import { template1 } from "@/features/editor/template/template-1";
import { template5 } from "@/features/editor/template/template-5";
import type { TemplateData } from "../types/template";

// Registry of all available templates
export const templateRegistry = {
	default: template1,
	1: template1,
	5: template5,
};

export type TemplateType = keyof typeof templateRegistry;

// Create templates for different print sizes
export function getTemplateForSize(
	template: TemplateData,
	size: {
		width: number;
		height: number;
	},
): TemplateData {
	const scaleX = size.width / template.width;
	const scaleY = size.height / template.height;

	return {
		...template,
		width: size.width,
		height: size.height,
		images: template.images.map((img) => ({
			...img,
			position: {
				x: img.position.x * scaleX,
				y: img.position.y * scaleY,
			},
			width: img.width * scaleX,
			height: img.height * scaleY,
		})),
		texts: template.texts.map((txt) => ({
			...txt,
			position: {
				x: txt.position.x * scaleX,
				y: txt.position.y * scaleY,
			},
			style: {
				...txt.style,
				fontSize: `${
					Number.parseFloat(txt.style.fontSize) * Math.min(scaleX, scaleY)
				}px`,
			},
		})),
		shapes: template.shapes.map((shape) => ({
			...shape,
			width: shape.width * scaleX,
			height: shape.height * scaleY,
			position: {
				x: shape.position.x * scaleX,
				y: shape.position.y * scaleY,
			},
		})),
		lines: template.lines.map((line) => ({
			...line,
			startPoint: {
				x: line.startPoint.x * scaleX,
				y: line.startPoint.y * scaleY,
			},
			endPoint: {
				x: line.endPoint.x * scaleX,
				y: line.endPoint.y * scaleY,
			},
		})),
	};
}

// Export print sizes
// export const printSizes: PrintSizeConfig[] = [
// 	{
// 		name: "10x20",
// 		width: 400,
// 		height: 800,
// 		label: "10x20 cm",
// 	},
// 	{
// 		name: "15x20",
// 		width: 600,
// 		height: 800,
// 		label: "15x20 cm",
// 	},
// 	{
// 		name: "20x30",
// 		width: 800,
// 		height: 1200,
// 		label: "20x30 cm",
// 	},
// ];

export function scaleTemplate(
	template: TemplateData,
	width: number,
	height: number,
): TemplateData {
	const scaleX = width / template.width;
	const scaleY = height / template.height;

	return {
		...template,
		width,
		height,
		images: template.images.map((img) => ({
			...img,
			position: {
				x: img.position.x * scaleX,
				y: img.position.y * scaleY,
			},
			width: img.width * scaleX,
			height: img.height * scaleY,
		})),
		texts: template.texts.map((txt) => ({
			...txt,
			position: {
				x: txt.position.x * scaleX,
				y: txt.position.y * scaleY,
			},
			style: {
				...txt.style,
				fontSize: `${Number.parseFloat(txt.style.fontSize) * Math.min(scaleX, scaleY)}px`,
			},
		})),
	};
}
