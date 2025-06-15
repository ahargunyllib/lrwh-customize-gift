"use client";

import type React from "react";

import type { TemplateData } from "@/shared/types/template";
import { useCallback, useEffect, useState } from "react";

interface UseResizeImageProps {
	setTemplate: React.Dispatch<React.SetStateAction<TemplateData>>;
	scale: number;
}

interface ResizeState {
	imageId: string;
	direction: string;
	startX: number;
	startY: number;
	startWidth: number;
	startHeight: number;
	aspectRatio: number;
}

export function useResizeImage({ setTemplate, scale }: UseResizeImageProps) {
	const [resizingImageId, setResizingImageId] = useState<string | null>(null);
	const [resizeState, setResizeState] = useState<ResizeState | null>(null);

	const handleResizeStart = useCallback(
		(
			e: React.MouseEvent,
			imageId: string,
			direction: string,
			width: number,
			height: number,
		) => {
			e.preventDefault();
			e.stopPropagation();

			const canvas = document.querySelector('[data-canvas="true"]');
			if (!canvas) return;

			const canvasRect = canvas.getBoundingClientRect();
			const startX = (e.clientX - canvasRect.left) / scale;
			const startY = (e.clientY - canvasRect.top) / scale;

			setResizingImageId(imageId);
			setResizeState({
				imageId,
				direction,
				startX,
				startY,
				startWidth: width,
				startHeight: height,
				aspectRatio: width / height,
			});
		},
		[scale],
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

			let newWidth = resizeState.startWidth;
			let newHeight = resizeState.startHeight;

			// Calculate new dimensions based on resize direction
			switch (resizeState.direction) {
				case "e": // East (right)
					newWidth = Math.max(20, resizeState.startWidth + deltaX);
					break;
				case "w": // West (left)
					newWidth = Math.max(20, resizeState.startWidth - deltaX);
					break;
				case "n": // North (top)
					newHeight = Math.max(20, resizeState.startHeight - deltaY);
					break;
				case "s": // South (bottom)
					newHeight = Math.max(20, resizeState.startHeight + deltaY);
					break;
				case "ne": // Northeast
					newWidth = Math.max(20, resizeState.startWidth + deltaX);
					newHeight = Math.max(20, resizeState.startHeight - deltaY);
					break;
				case "nw": // Northwest
					newWidth = Math.max(20, resizeState.startWidth - deltaX);
					newHeight = Math.max(20, resizeState.startHeight - deltaY);
					break;
				case "se": // Southeast
					newWidth = Math.max(20, resizeState.startWidth + deltaX);
					newHeight = Math.max(20, resizeState.startHeight + deltaY);
					break;
				case "sw": // Southwest
					newWidth = Math.max(20, resizeState.startWidth - deltaX);
					newHeight = Math.max(20, resizeState.startHeight + deltaY);
					break;
			}

			// Maintain aspect ratio for corner handles (hold Shift to ignore)
			if (
				["ne", "nw", "se", "sw"].includes(resizeState.direction) &&
				!e.shiftKey
			) {
				if (Math.abs(deltaX) > Math.abs(deltaY)) {
					newHeight = newWidth / resizeState.aspectRatio;
				} else {
					newWidth = newHeight * resizeState.aspectRatio;
				}
			}

			// Update template with new dimensions
			setTemplate((prev) => ({
				...prev,
				images: prev.images.map((img) => {
					if (img.id === resizeState.imageId) {
						const newPosition = { ...img.position };

						// Adjust position for handles that affect the top-left corner
						if (resizeState.direction.includes("w")) {
							newPosition.x = img.position.x + (img.width - newWidth);
						}
						if (resizeState.direction.includes("n")) {
							newPosition.y = img.position.y + (img.height - newHeight);
						}

						return {
							...img,
							width: Math.round(newWidth),
							height: Math.round(newHeight),
							position: newPosition,
						};
					}
					return img;
				}),
			}));
		},
		[resizeState, scale, setTemplate],
	);

	const handleMouseUp = useCallback(() => {
		setResizingImageId(null);
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

	return {
		resizingImageId,
		setResizingImageId,
		handleResizeStart,
	};
}
