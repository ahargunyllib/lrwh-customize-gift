"use client";
import { printSizes, scaleTemplate } from "@/shared/lib/template";
import type { LineElement } from "@/shared/types/element/line";
import type { ShapeElement } from "@/shared/types/element/shape";
import type {
	ImageElement,
	TemplateData,
	TextElement,
} from "@/shared/types/template";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

export function useTemplateEditor(initial?: TemplateData) {
	// const [template, setTemplate] = useState<TemplateData>(
	// 	initial ?? {
	// 		id: uuidv4(),
	// 		name: "Custom Template",
	// 		width: printSizes[1].width,
	// 		height: printSizes[1].height,
	// 		backgroundColor: "#ffffff",
	// 		images: [],
	// 		texts: [],
	//     shapes: [],
	// 	},
	// );
	const [template, setTemplate] = useState<TemplateData>({
		id: uuidv4(),
		name: "Custom Template",
		width: printSizes[1].width,
		height: printSizes[1].height,
		backgroundColor: "#ffffff",
		images: [],
		texts: [],
		shapes: [],
	});
	const [activeElement, setActiveElement] = useState<string | null>(null);

	const addImage = (): string => {
		const id = uuidv4();
		const img: ImageElement = {
			id,
			type: "image",
			src: "/placeholder.png",
			position: { x: template.width / 2 - 100, y: template.height / 2 - 100 },
			width: 200,
			height: 200,
			draggable: true,
		};
		setTemplate((p) => ({ ...p, images: [...p.images, img] }));
		setActiveElement(id);
		return id;
	};

	const addText = (): string => {
		const id = uuidv4();
		const txt: TextElement = {
			id,
			type: "text",
			content: "New Text",
			position: { x: template.width / 2 - 100, y: template.height / 2 },
			draggable: true,
			style: {
				fontFamily: "Arial, sans-serif",
				fontSize: "24px",
				fontWeight: "normal",
				color: "#000000",
				textAlign: "center",
				lineHeight: "1.2",
			},
		};
		setTemplate((p) => ({ ...p, texts: [...p.texts, txt] }));
		setActiveElement(id);
		return id;
	};

	/* Start Shape Element */
	const addShape = (type: ShapeElement["type"]) => {
		const id = uuidv4();
		const shape: ShapeElement = {
			id,
			type,
			width: 100,
			height: 100,
			position: { x: template.width / 2 - 50, y: template.height / 2 - 50 },
			rotation: 0,
			fill: "#000000",
			stroke: "#ffffff",
			strokeWidth: 1,
			draggable: true,
		};

		setTemplate((p) => {
			console.log(p);
			return { ...p, shapes: [...p.shapes, shape] };
		});
		setActiveElement(id);
		return id;
	};
	const updateShape = (id: string, payload: Partial<ShapeElement>) =>
		setTemplate((p) => ({
			...p,
			shapes: p.shapes.map((s) => (s.id === id ? { ...s, ...payload } : s)),
		}));
	/* End Shape Element */

	const deleteElement = (id: string) =>
		setTemplate((p) => ({
			...p,
			images: p.images.filter((i) => i.id !== id),
			texts: p.texts.filter((t) => t.id !== id),
			shapes: p.shapes.filter((s) => s.id !== id),
		}));

	const updateImage = (id: string, payload: Partial<ImageElement>) =>
		setTemplate((p) => ({
			...p,
			images: p.images.map((i) => (i.id === id ? { ...i, ...payload } : i)),
		}));

	const updateText = (id: string, payload: Partial<TextElement>) =>
		setTemplate((p) => ({
			...p,
			texts: p.texts.map((t) => (t.id === id ? { ...t, ...payload } : t)),
		}));

	const changePrintSize = (sizeName: string) => {
		const size = printSizes.find((s) => s.name === sizeName);
		if (size) setTemplate((p) => scaleTemplate(p, size));
	};

	return {
		template,
		setTemplate,
		activeElement,
		setActiveElement,
		addImage,
		addText,
		addShape,
		updateShape,
		deleteElement,
		updateImage,
		updateText,
		changePrintSize,
	};
}
