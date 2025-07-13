"use client";
import type {
	ImageElement,
	TemplateData,
	TextElement,
} from "@/shared/types/template";
import { useEffect, useState } from "react";

interface UseAlignmentGuidesProps {
	template: TemplateData;
	activeElement: string | null;
	scale: number;
}

export type GuideType =
	| "centerX"
	| "centerY"
	| "alignLeft"
	| "alignRight"
	| "alignTop"
	| "alignBottom"
	| "centerToCenterX"
	| "centerToCenterY";

export interface Guide {
	type: GuideType;
	position: number;
	startPosition?: number;
	endPosition?: number;
}

function getElementDimensions(element: ImageElement | TextElement): {
	width: number;
	height: number;
} {
	if ("width" in element && "height" in element) {
		return { width: element.width, height: element.height };
	}
	const textElement = element as TextElement;
	const domElement = document.getElementById(textElement.id);
	if (domElement) {
		const rect = domElement.getBoundingClientRect();
		return {
			width: rect.width,
			height: rect.height,
		};
	}

	let fontSize = 16;
	if (textElement.style.fontSize) {
		if (typeof textElement.style.fontSize === "string") {
			const parsed = Number.parseFloat(textElement.style.fontSize);
			if (!Number.isNaN(parsed)) fontSize = parsed;
		} else {
			fontSize = textElement.style.fontSize;
		}
	}
	const lineHeight =
		typeof textElement.style.lineHeight === "number"
			? textElement.style.lineHeight
			: Number.parseFloat(textElement.style.lineHeight as string) || 1.2;
	const lines = textElement.content.split("\n");
	const maxLineLength = Math.max(...lines.map((line) => line.length));

	return {
		width: maxLineLength * fontSize * 0.6,
		height: lines.length * fontSize * lineHeight,
	};
}

export function useAlignmentGuides({
	template,
	activeElement,
	scale,
}: UseAlignmentGuidesProps) {
	const [guides, setGuides] = useState<Guide[]>([]);
	const [isSnapping, setIsSnapping] = useState(false);
	const [snapThreshold] = useState(10);

	useEffect(() => {
		if (!activeElement) {
			setGuides([]);
			return;
		}

		const activeImage = template.images.find((img) => img.id === activeElement);
		const activeText = template.texts.find((txt) => txt.id === activeElement);
		if (!activeImage && !activeText) {
			setGuides([]);
			return;
		}

		const newGuides: Guide[] = [];
		let shouldSnap = false;

		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		const activeElementData = activeImage || activeText!;
		const activePos = activeElementData.position;
		const { width: activeWidth, height: activeHeight } =
			getElementDimensions(activeElementData);

		const canvasCenterX = template.width / 2;
		const canvasCenterY = template.height / 2;
		const elementCenterX = activePos.x + activeWidth / 2;
		const elementCenterY = activePos.y + activeHeight / 2;

		if (Math.abs(elementCenterX - canvasCenterX) < snapThreshold / scale) {
			newGuides.push({ type: "centerX", position: canvasCenterX });
			shouldSnap = true;
		}

		if (Math.abs(elementCenterY - canvasCenterY) < snapThreshold / scale) {
			newGuides.push({ type: "centerY", position: canvasCenterY });
			shouldSnap = true;
		}

		const otherElements: Array<ImageElement | TextElement> = [
			...template.images.filter((img) => img.id !== activeElement),
			...template.texts.filter((txt) => txt.id !== activeElement),
		];

		// biome-ignore lint/complexity/noForEach: <explanation>
		otherElements.forEach((element) => {
			const elementPos = element.position;
			const { width: elementWidth, height: elementHeight } =
				getElementDimensions(element);

			const otherElementCenterX = elementPos.x + elementWidth / 2;
			const otherElementCenterY = elementPos.y + elementHeight / 2;

			if (
				Math.abs(elementCenterX - otherElementCenterX) <
				snapThreshold / scale
			) {
				newGuides.push({
					type: "centerToCenterX",
					position: otherElementCenterX,
					startPosition: Math.min(activePos.y, elementPos.y),
					endPosition: Math.max(
						activePos.y + activeHeight,
						elementPos.y + elementHeight,
					),
				});
				shouldSnap = true;
			}

			if (
				Math.abs(elementCenterY - otherElementCenterY) <
				snapThreshold / scale
			) {
				newGuides.push({
					type: "centerToCenterY",
					position: otherElementCenterY,
					startPosition: Math.min(activePos.x, elementPos.x),
					endPosition: Math.max(
						activePos.x + activeWidth,
						elementPos.x + elementWidth,
					),
				});
				shouldSnap = true;
			}

			if (Math.abs(activePos.x - elementPos.x) < snapThreshold / scale) {
				newGuides.push({ type: "alignLeft", position: elementPos.x });
				shouldSnap = true;
			}

			if (
				Math.abs(activePos.x + activeWidth - (elementPos.x + elementWidth)) <
				snapThreshold / scale
			) {
				newGuides.push({
					type: "alignRight",
					position: elementPos.x + elementWidth,
				});
				shouldSnap = true;
			}

			if (Math.abs(activePos.y - elementPos.y) < snapThreshold / scale) {
				newGuides.push({ type: "alignTop", position: elementPos.y });
				shouldSnap = true;
			}

			if (
				Math.abs(activePos.y + activeHeight - (elementPos.y + elementHeight)) <
				snapThreshold / scale
			) {
				newGuides.push({
					type: "alignBottom",
					position: elementPos.y + elementHeight,
				});
				shouldSnap = true;
			}
		});

		setGuides(newGuides);
		setIsSnapping(shouldSnap);
	}, [activeElement, template, scale, snapThreshold]);

	const centerElement = (axis: "x" | "y" | "both") => {
		if (!activeElement) return;

		const activeImage = template.images.find((img) => img.id === activeElement);
		const activeText = template.texts.find((txt) => txt.id === activeElement);
		if (!activeImage && !activeText) return;

		document.dispatchEvent(
			new CustomEvent("elementCenter", {
				detail: {
					id: activeElement,
					type: activeImage ? "image" : "text",
					axis,
				},
			}),
		);
	};

	const getSnapPosition = (
		position: { x: number; y: number },
		elementWidth: number,
		elementHeight: number,
	) => {
		if (!isSnapping) return position;

		const newPosition = { ...position };
		const breakawayThreshold = (snapThreshold * 1.5) / scale;

		const horizontalGuides = guides.filter(
			(g) =>
				g.type === "centerX" ||
				g.type === "centerToCenterX" ||
				g.type === "alignLeft" ||
				g.type === "alignRight",
		);

		// biome-ignore lint/complexity/noForEach: <explanation>
		horizontalGuides.forEach((g) => {
			let snapX: number | null = null;
			if (g.type === "centerX" || g.type === "centerToCenterX") {
				snapX = g.position - elementWidth / 2;
			} else if (g.type === "alignLeft") {
				snapX = g.position;
			} else if (g.type === "alignRight") {
				snapX = g.position - elementWidth;
			}

			if (snapX !== null && Math.abs(position.x - snapX) < breakawayThreshold) {
				newPosition.x = snapX;
			}
		});

		const verticalGuides = guides.filter(
			(g) =>
				g.type === "centerY" ||
				g.type === "centerToCenterY" ||
				g.type === "alignTop" ||
				g.type === "alignBottom",
		);

		// biome-ignore lint/complexity/noForEach: <explanation>
		verticalGuides.forEach((g) => {
			let snapY: number | null = null;
			if (g.type === "centerY" || g.type === "centerToCenterY") {
				snapY = g.position - elementHeight / 2;
			} else if (g.type === "alignTop") {
				snapY = g.position;
			} else if (g.type === "alignBottom") {
				snapY = g.position - elementHeight;
			}

			if (snapY !== null && Math.abs(position.y - snapY) < breakawayThreshold) {
				newPosition.y = snapY;
			}
		});

		return newPosition;
	};

	const constrainToCanvas = (
		position: { x: number; y: number },
		elementWidth: number,
		elementHeight: number,
	) => {
		return {
			x: Math.max(0, Math.min(template.width - elementWidth, position.x)),
			y: Math.max(0, Math.min(template.height - elementHeight, position.y)),
		};
	};

	return {
		guides,
		centerElement,
		isSnapping,
		getSnapPosition,
		constrainToCanvas,
	};
}
