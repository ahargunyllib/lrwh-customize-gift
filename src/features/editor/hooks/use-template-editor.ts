"use client";
import { scaleTemplate } from "@/shared/lib/template";
import type { LineElement } from "@/shared/types/element/line";
import type { ShapeElement } from "@/shared/types/element/shape";
import type {
	ImageElement,
	TemplateData,
	TextElement,
} from "@/shared/types/template";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { getLineConfig } from "../utils/line-config";

export function useTemplateEditor(initial?: TemplateData) {
	const [template, setTemplate] = useState<TemplateData>(
		initial ?? {
			id: uuidv4(),
			name: "Custom Template",
			width: 10 * 40,
			height: 20 * 40,
			backgroundColor: "#ffffff",
			images: [],
			texts: [],
			shapes: [],
			lines: [],
		},
	);

	const [activeElement, setActiveElement] = useState<string | null>(null);

	const addImage = (): string => {
		const id = uuidv4();
		const img: ImageElement = {
			id,
			type: "image",
			src: "/placeholder.png",
			zIndex: 1,
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
			width: 200,
			height: 50,
			draggable: true,
			zIndex: 1,
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
			borderColor: "#ffffff",
			borderWidth: 0,
			borderRadius: 0,
			opacity: 100,
			draggable: true,
			zIndex: 1,
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
	/* Start Line Element */
	const addLine = (type: LineElement["type"]) => {
		const id = uuidv4();
		const line: LineElement = getLineConfig(type);
		setTemplate((p) => ({
			...p,
			lines: [...p.lines, line],
		}));
		setActiveElement(id);
		return id;
	};
	const updateLine = (id: string, payload: Partial<LineElement>) =>
		setTemplate((p) => ({
			...p,
			lines: p.lines.map((l) => (l.id === id ? { ...l, ...payload } : l)),
		}));
	/* End Line Element */

	const deleteElement = (id: string) =>
		setTemplate((p) => ({
			...p,
			images: p.images.filter((i) => i.id !== id),
			texts: p.texts.filter((t) => t.id !== id),
			shapes: p.shapes.filter((s) => s.id !== id),
			lines: p.lines.filter((l) => l.id !== id),
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

	/**
	 * Changes the print size of the template by scaling it to the specified dimensions.
	 *
	 * @param width - The width of the print size in centimeters (cm).
	 * @param height - The height of the print size in centimeters (cm).
	 */
	const changePrintSize = (width: number, height: number) => {
		// const size = printSizes.find((s) => s.name === sizeName);
		// if (size) setTemplate((p) => scaleTemplate(p, size));
		scaleTemplate(template, width * 40, height * 40); // assuming size is in cm, convert to pixels (1cm = 40px)
	};

	const getAllElements = (template: TemplateData) => [
		...template.images,
		...template.texts,
	];

	const splitElements = (
		elements: (ImageElement | TextElement)[],
	): { images: ImageElement[]; texts: TextElement[] } => ({
		images: elements.filter((el): el is ImageElement => el.type === "image"),
		texts: elements.filter((el): el is TextElement => el.type === "text"),
	});

	const bringForward = (id: string) => {
		setTemplate((prev) => {
			const all = getAllElements(prev);
			const index = all.findIndex((el) => el.id === id);
			if (index === -1 || index === all.length - 1) return prev;
			const reordered = [...all];
			[reordered[index], reordered[index + 1]] = [
				reordered[index + 1],
				reordered[index],
			];
			return { ...prev, ...splitElements(reordered) };
		});
	};

	const sendBackward = (id: string) => {
		setTemplate((prev) => {
			const all = getAllElements(prev);
			const index = all.findIndex((el) => el.id === id);
			if (index <= 0) return prev;
			const reordered = [...all];
			[reordered[index], reordered[index - 1]] = [
				reordered[index - 1],
				reordered[index],
			];
			return { ...prev, ...splitElements(reordered) };
		});
	};

	const bringToFront = (id: string) => {
		setTemplate((prev) => {
			const all = getAllElements(prev);
			const index = all.findIndex((el) => el.id === id);
			if (index === -1 || index === all.length - 1) return prev;
			const reordered = [...all];
			const [target] = reordered.splice(index, 1);
			reordered.push(target);
			return { ...prev, ...splitElements(reordered) };
		});
	};

	const sendToBack = (id: string) => {
		setTemplate((prev) => {
			const all = getAllElements(prev);
			const index = all.findIndex((el) => el.id === id);
			if (index <= 0) return prev;
			const reordered = [...all];
			const [target] = reordered.splice(index, 1);
			reordered.unshift(target);
			return { ...prev, ...splitElements(reordered) };
		});
	};

	return {
		template,
		setTemplate,
		activeElement,
		setActiveElement,
		addImage,
		addText,
		addShape,
		addLine,
		updateShape,
		updateLine,
		deleteElement,
		updateImage,
		updateText,
		changePrintSize,
		bringForward,
		sendBackward,
		bringToFront,
		sendToBack,
	};
}
