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
	// For center-to-center guides, we need to know the start and end positions
	startPosition?: number;
	endPosition?: number;
}

export function useAlignmentGuides({
	template,
	activeElement,
	scale,
}: UseAlignmentGuidesProps) {
	const [guides, setGuides] = useState<Guide[]>([]);
	const [isSnapping, setIsSnapping] = useState(false);
	const [snapThreshold] = useState(10); // Pixels within which to snap

	// Calculate guides when active element moves
	useEffect(() => {
		if (!activeElement) {
			setGuides([]);
			return;
		}

		// Find the active element
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
		const activePos = activeImage ? activeImage.position : activeText!.position;
		const activeWidth = activeImage ? activeImage.width : 0;
		const activeHeight = activeImage ? activeImage.height : 0;

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
			const elementWidth = "width" in element ? element.width : 0;
			const elementHeight = "height" in element ? element.height : 0;

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
				"width" in element &&
				activeWidth &&
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
				"height" in element &&
				activeHeight &&
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

	// Function to center the active element
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

	// Function to get snap position if snapping
	const getSnapPosition = (
		position: { x: number; y: number },
		elementWidth: number,
		elementHeight: number,
	) => {
		if (!isSnapping) return position;

		const newPosition = { ...position };
		const elementCenterX = position.x + elementWidth / 2;
		const elementCenterY = position.y + elementHeight / 2;

		// Calculate the distance from current position to potential snap positions
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

		// Define a breakaway threshold - if the element is moved more than this distance from
		// the snap position, allow it to break free from snapping
		const breakawayThreshold = (snapThreshold * 1.5) / scale;

		// Check for horizontal center snapping
		if (horizontalGuide) {
			const snapX = horizontalGuide.position - elementWidth / 2;
			// Only snap if we're within the threshold
			if (Math.abs(position.x - snapX) < breakawayThreshold) {
				newPosition.x = snapX;
			}
		}

		// Check for vertical center snapping
		if (verticalGuide) {
			const snapY = verticalGuide.position - elementHeight / 2;
			// Only snap if we're within the threshold
			if (Math.abs(position.y - snapY) < breakawayThreshold) {
				newPosition.y = snapY;
			}
		}

		// Check for left edge alignment
		if (leftGuide) {
			// Only snap if we're within the threshold
			if (Math.abs(position.x - leftGuide.position) < breakawayThreshold) {
				newPosition.x = leftGuide.position;
			}
		}

		// Check for right edge alignment
		if (rightGuide) {
			const snapX = rightGuide.position - elementWidth;
			// Only snap if we're within the threshold
			if (Math.abs(position.x - snapX) < breakawayThreshold) {
				newPosition.x = snapX;
			}
		}

		// Check for top edge alignment
		if (topGuide) {
			// Only snap if we're within the threshold
			if (Math.abs(position.y - topGuide.position) < breakawayThreshold) {
				newPosition.y = topGuide.position;
			}
		}

		// Check for bottom edge alignment
		if (bottomGuide) {
			const snapY = bottomGuide.position - elementHeight;
			// Only snap if we're within the threshold
			if (Math.abs(position.y - snapY) < breakawayThreshold) {
				newPosition.y = snapY;
			}
		}

		return newPosition;
	};

	// Function to constrain element within canvas boundaries
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
