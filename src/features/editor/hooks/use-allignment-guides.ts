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

// Helper function to get element dimensions
function getElementDimensions(element: ImageElement | TextElement): {
	width: number;
	height: number;
} {
	if ("width" in element && "height" in element) {
		// Image element
		return { width: element.width, height: element.height };
		// biome-ignore lint/style/noUselessElse: <explanation>
	} else {
		// Text element - calculate approximate dimensions
		const textElement = element as TextElement;

		// Get actual DOM element to calculate dimensions
		const domElement = document.getElementById(textElement.id);
		if (domElement) {
			const rect = domElement.getBoundingClientRect();
			return {
				width: rect.width,
				height: rect.height,
			};
		}

		// Fallback: estimate based on font size and text length
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
			width: maxLineLength * fontSize * 0.6, // Approximate character width
			height: lines.length * fontSize * lineHeight,
		};
	}
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

		// Get active element position and dimensions
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		const activeElementData = activeImage || activeText!;
		const activePos = activeElementData.position;
		const { width: activeWidth, height: activeHeight } =
			getElementDimensions(activeElementData);

		// Canvas center guides
		const canvasCenterX = template.width / 2;
		const canvasCenterY = template.height / 2;

		// Calculate active element center
		const elementCenterX = activePos.x + activeWidth / 2;
		const elementCenterY = activePos.y + activeHeight / 2;

		// Check if element is near canvas center X
		if (Math.abs(elementCenterX - canvasCenterX) < snapThreshold / scale) {
			newGuides.push({ type: "centerX", position: canvasCenterX });
			shouldSnap = true;
		}

		// Check if element is near canvas center Y
		if (Math.abs(elementCenterY - canvasCenterY) < snapThreshold / scale) {
			newGuides.push({ type: "centerY", position: canvasCenterY });
			shouldSnap = true;
		}

		// Check alignment with other elements
		const otherElements: Array<ImageElement | TextElement> = [
			...template.images.filter((img) => img.id !== activeElement),
			...template.texts.filter((txt) => txt.id !== activeElement),
		];

		// biome-ignore lint/complexity/noForEach: <explanation>
		otherElements.forEach((element) => {
			const elementPos = element.position;
			const { width: elementWidth, height: elementHeight } =
				getElementDimensions(element);

			// Calculate other element center
			const otherElementCenterX = elementPos.x + elementWidth / 2;
			const otherElementCenterY = elementPos.y + elementHeight / 2;

			// Center to center alignment X
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

			// Center to center alignment Y
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

			// Left alignment
			if (Math.abs(activePos.x - elementPos.x) < snapThreshold / scale) {
				newGuides.push({ type: "alignLeft", position: elementPos.x });
				shouldSnap = true;
			}

			// Right alignment
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

			// Top alignment
			if (Math.abs(activePos.y - elementPos.y) < snapThreshold / scale) {
				newGuides.push({ type: "alignTop", position: elementPos.y });
				shouldSnap = true;
			}

			// Bottom alignment
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

		const horizontalGuide = guides.find(
			(g) => g.type === "centerX" || g.type === "centerToCenterX",
		);
		const verticalGuide = guides.find(
			(g) => g.type === "centerY" || g.type === "centerToCenterY",
		);
		const leftGuide = guides.find((g) => g.type === "alignLeft");
		const rightGuide = guides.find((g) => g.type === "alignRight");
		const topGuide = guides.find((g) => g.type === "alignTop");
		const bottomGuide = guides.find((g) => g.type === "alignBottom");

		const breakawayThreshold = (snapThreshold * 1.5) / scale;

		// Check for horizontal center snapping
		if (horizontalGuide) {
			const snapX = horizontalGuide.position - elementWidth / 2;
			if (Math.abs(position.x - snapX) < breakawayThreshold) {
				newPosition.x = snapX;
			}
		}

		// Check for vertical center snapping
		if (verticalGuide) {
			const snapY = verticalGuide.position - elementHeight / 2;
			if (Math.abs(position.y - snapY) < breakawayThreshold) {
				newPosition.y = snapY;
			}
		}

		// Check for left edge alignment
		if (leftGuide) {
			if (Math.abs(position.x - leftGuide.position) < breakawayThreshold) {
				newPosition.x = leftGuide.position;
			}
		}

		// Check for right edge alignment
		if (rightGuide) {
			const snapX = rightGuide.position - elementWidth;
			if (Math.abs(position.x - snapX) < breakawayThreshold) {
				newPosition.x = snapX;
			}
		}

		// Check for top edge alignment
		if (topGuide) {
			if (Math.abs(position.y - topGuide.position) < breakawayThreshold) {
				newPosition.y = topGuide.position;
			}
		}

		// Check for bottom edge alignment
		if (bottomGuide) {
			const snapY = bottomGuide.position - elementHeight;
			if (Math.abs(position.y - snapY) < breakawayThreshold) {
				newPosition.y = snapY;
			}
		}

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
