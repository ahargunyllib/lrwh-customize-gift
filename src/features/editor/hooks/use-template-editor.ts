"use client";
import { scaleTemplate } from "@/shared/lib/template";
import type {
	ImageElement,
	TemplateData,
	TextElement,
} from "@/shared/types/template";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

export function useTemplateEditor(initial?: TemplateData) {
	const [template, setTemplate] = useState<TemplateData>(
		initial ?? {
			id: uuidv4(),
			name: "Custom Template",
			width: 10 * 40, // default width in pixels (10cm * 40px/cm)
			height: 20 * 40, // default height in pixels (20cm * 40px/cm)
			backgroundColor: "#ffffff",
			images: [],
			texts: [],
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

	const deleteElement = (id: string) =>
		setTemplate((p) => ({
			...p,
			images: p.images.filter((i) => i.id !== id),
			texts: p.texts.filter((t) => t.id !== id),
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
