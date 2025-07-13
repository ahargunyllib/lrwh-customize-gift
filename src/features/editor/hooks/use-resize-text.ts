"use client";

import type { TemplateData } from "@/shared/types/template";
import type React from "react";
import { useCallback, useEffect, useState } from "react";

interface UseResizeTextProps {
	setTemplate: React.Dispatch<React.SetStateAction<TemplateData>>;
	scale: number;
}

interface ResizeState {
	textId: string;
	direction: string;
	startX: number;
	startY: number;
	startWidth: number;
	startHeight: number;
	startPosX: number;
	startPosY: number;
	startFontSize: number;
}

export function useResizeText({ setTemplate, scale }: UseResizeTextProps) {
	const [resizingTextId, setResizingTextId] = useState<string | null>(null);
	const [resizeState, setResizeState] = useState<ResizeState | null>(null);

	const handleResizeStart = useCallback(
		(
			e: React.MouseEvent,
			textId: string,
			direction: string,
			width: number,
			height: number,
			posX: number,
			posY: number,
		) => {
			e.preventDefault();
			e.stopPropagation();

			const canvas = document.querySelector('[data-canvas="true"]');
			if (!canvas) return;

			const canvasRect = canvas.getBoundingClientRect();
			const startX = (e.clientX - canvasRect.left) / scale;
			const startY = (e.clientY - canvasRect.top) / scale;

			// Get current font size
			let startFontSize = 16;
			setTemplate((prev) => {
				const textElement = prev.texts.find((t) => t.id === textId);
				if (textElement) {
					startFontSize =
						typeof textElement.style.fontSize === "string"
							? Number.parseFloat(textElement.style.fontSize)
							: textElement.style.fontSize || 16;
				}
				return prev;
			});

			setResizingTextId(textId);
			setResizeState({
				textId,
				direction,
				startX,
				startY,
				startWidth: width,
				startHeight: height,
				startPosX: posX,
				startPosY: posY,
				startFontSize,
			});
		},
		[scale, setTemplate],
	);

	const calculateTextHeight = useCallback(
		(content: string, width: number, fontSize: number, lineHeight: string) => {
			// Create a temporary textarea to measure height
			const tempTextarea = document.createElement("textarea");
			tempTextarea.style.position = "absolute";
			tempTextarea.style.top = "-9999px";
			tempTextarea.style.left = "-9999px";
			tempTextarea.style.visibility = "hidden";
			tempTextarea.style.width = `${width}px`;
			tempTextarea.style.fontSize = `${fontSize}px`;
			tempTextarea.style.lineHeight = lineHeight;
			tempTextarea.style.padding = "8px";
			tempTextarea.style.border = "none";
			tempTextarea.style.outline = "none";
			tempTextarea.style.resize = "none";
			tempTextarea.style.overflow = "hidden";
			tempTextarea.style.wordWrap = "break-word";
			tempTextarea.style.whiteSpace = "pre-wrap";
			tempTextarea.style.boxSizing = "border-box";
			tempTextarea.value = content;

			document.body.appendChild(tempTextarea);
			tempTextarea.style.height = "auto";
			const height = tempTextarea.scrollHeight;
			document.body.removeChild(tempTextarea);

			return height;
		},
		[],
	);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!resizeState) return;

			const canvas = document.querySelector('[data-canvas="true"]');
			if (!canvas) return;

			const canvasRect = canvas.getBoundingClientRect();
			const currentX = (e.clientX - canvasRect.left) / scale;
			const currentY = (e.clientY - canvasRect.top) / scale;

			const deltaX = currentX - resizeState.startX;
			const deltaY = currentY - resizeState.startY;

			// Check if it's a corner handle (diagonal resize)
			const isCornerHandle = ["ne", "nw", "se", "sw"].includes(
				resizeState.direction,
			);

			if (isCornerHandle) {
				// DIAGONAL RESIZE - Change width, height, and font size based on movement

				// Calculate diagonal distance for font size change
				const diagonalDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

				// Determine if expanding or shrinking based on handle direction and movement
				let isExpanding = false;
				switch (resizeState.direction) {
					case "se": // Southeast - expanding if moving away from top-left
						isExpanding = deltaX > 0 || deltaY > 0;
						break;
					case "sw": // Southwest - expanding if moving away from top-right
						isExpanding = deltaX < 0 || deltaY > 0;
						break;
					case "ne": // Northeast - expanding if moving away from bottom-left
						isExpanding = deltaX > 0 || deltaY < 0;
						break;
					case "nw": // Northwest - expanding if moving away from bottom-right
						isExpanding = deltaX < 0 || deltaY < 0;
						break;
				}

				// Calculate new font size based on diagonal distance
				const fontSizeChange = diagonalDistance * 0.05; // Reduced sensitivity for smoother control
				const newFontSize = isExpanding
					? Math.min(72, resizeState.startFontSize + fontSizeChange) // Max 72px
					: Math.max(8, resizeState.startFontSize - fontSizeChange); // Min 8px

				// Calculate new width and height based on actual mouse movement
				let newWidth = resizeState.startWidth;
				let newHeight = resizeState.startHeight;

				const minWidth = 50;
				const minHeight = 30;

				switch (resizeState.direction) {
					case "se": // Southeast - width and height increase
						newWidth = Math.max(minWidth, resizeState.startWidth + deltaX);
						newHeight = Math.max(minHeight, resizeState.startHeight + deltaY);
						break;
					case "sw": // Southwest - width decreases, height increases
						newWidth = Math.max(minWidth, resizeState.startWidth - deltaX);
						newHeight = Math.max(minHeight, resizeState.startHeight + deltaY);
						break;
					case "ne": // Northeast - width increases, height decreases
						newWidth = Math.max(minWidth, resizeState.startWidth + deltaX);
						newHeight = Math.max(minHeight, resizeState.startHeight - deltaY);
						break;
					case "nw": // Northwest - both width and height decrease
						newWidth = Math.max(minWidth, resizeState.startWidth - deltaX);
						newHeight = Math.max(minHeight, resizeState.startHeight - deltaY);
						break;
				}

				setTemplate((prev) => ({
					...prev,
					texts: prev.texts.map((text) => {
						if (text.id === resizeState.textId) {
							const newPosition = { ...text.position };

							// Adjust position for handles that affect the left edge
							if (resizeState.direction.includes("w")) {
								newPosition.x =
									resizeState.startPosX + (resizeState.startWidth - newWidth);
							}
							// Adjust position for handles that affect the top edge
							if (resizeState.direction.includes("n")) {
								newPosition.y =
									resizeState.startPosY + (resizeState.startHeight - newHeight);
							}

							return {
								...text,
								width: Math.round(newWidth),
								height: Math.round(newHeight),
								position: newPosition,
								style: {
									...text.style,
									fontSize: Math.round(newFontSize),
								},
							};
						}
						return text;
					}),
				}));
			} else {
				// EDGE RESIZE - Change width/height only (original behavior)
				let newWidth = resizeState.startWidth;
				let newHeight = resizeState.startHeight;
				const minWidth = 50;
				const minHeight = 30;

				switch (resizeState.direction) {
					case "e": // East (right) - hanya horizontal
						newWidth = Math.max(minWidth, resizeState.startWidth + deltaX);
						break;
					case "w": // West (left) - hanya horizontal
						newWidth = Math.max(minWidth, resizeState.startWidth - deltaX);
						break;
					case "n": // North - hanya vertikal
						newHeight = Math.max(minHeight, resizeState.startHeight - deltaY);
						break;
					case "s": // South - hanya vertikal
						newHeight = Math.max(minHeight, resizeState.startHeight + deltaY);
						break;
				}

				setTemplate((prev) => ({
					...prev,
					texts: prev.texts.map((text) => {
						if (text.id === resizeState.textId) {
							const newPosition = { ...text.position };

							// Adjust position for handles that affect the left edge
							if (resizeState.direction.includes("w")) {
								newPosition.x =
									resizeState.startPosX + (resizeState.startWidth - newWidth);
							}
							// Adjust position for handles that affect the top edge
							if (resizeState.direction.includes("n")) {
								newPosition.y =
									resizeState.startPosY + (resizeState.startHeight - newHeight);
							}

							return {
								...text,
								width: Math.round(newWidth),
								height: Math.round(newHeight),
								position: newPosition,
							};
						}
						return text;
					}),
				}));
			}
		},
		[resizeState, scale, setTemplate],
	);

	const handleMouseUp = useCallback(() => {
		// Cleanup resize state
		setResizingTextId(null);
		setResizeState(null);
	}, []);

	// Set up mouse event listeners
	useEffect(() => {
		if (!resizeState) return;

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [resizeState, handleMouseMove, handleMouseUp]);

	// Handle escape key to cancel resize
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && resizingTextId) {
				setResizingTextId(null);
				setResizeState(null);
			}
		};

		if (resizingTextId) {
			document.addEventListener("keydown", handleKeyDown);
			return () => document.removeEventListener("keydown", handleKeyDown);
		}
	}, [resizingTextId]);

	return {
		resizingTextId,
		setResizingTextId,
		handleResizeStart,
	};
}
