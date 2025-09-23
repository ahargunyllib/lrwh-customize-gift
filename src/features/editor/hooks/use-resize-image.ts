import type { TemplateData } from "@/shared/types/template";
import type React from "react";
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
	startPosition: { x: number; y: number };
	aspectRatio: number;
	originalScaleX: number;
	originalScaleY: number;
	originalImageOffset: { x: number; y: number };
	naturalDimensions: { width: number; height: number };
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

			setTemplate((prev) => {
				const image = prev.images.find((img) => img.id === imageId);
				if (!image) return prev;

				// Get image element to access natural dimensions
				const imgElement = document.querySelector(
					`img[src="${image.src}"]`,
				) as HTMLImageElement;
				const naturalWidth = imgElement?.naturalWidth;
				const naturalHeight = imgElement?.naturalHeight;

				setResizingImageId(imageId);
				setResizeState({
					imageId,
					direction,
					startX,
					startY,
					startWidth: width,
					startHeight: height,
					startPosition: { ...image.position },
					aspectRatio: width / height,
					originalScaleX: image.scaleX || 1,
					originalScaleY: image.scaleY || 1,
					originalImageOffset: image.imageOffset || { x: 0, y: 0 },
					naturalDimensions: { width: naturalWidth, height: naturalHeight },
				});

				return prev;
			});
		},
		[scale, setTemplate],
	);

	const calculateImageAdjustment = useCallback(
		(
			newWidth: number,
			newHeight: number,
			resizeState: ResizeState,
			direction: string,
		) => {
			const { naturalDimensions } = resizeState;

			// Calculate how to adjust the image scaling based on container size change
			let newScaleX = resizeState.originalScaleX;
			let newScaleY = resizeState.originalScaleY;
			let newImageOffset = resizeState.originalImageOffset;

			// For edge resizing, only adjust one axis
			if (direction === "e" || direction === "w") {
				// Horizontal edge - only adjust scaleX
				const widthRatio = newWidth / resizeState.startWidth;
				newScaleX = resizeState.originalScaleX * widthRatio;

				// Adjust X offset proportionally
				newImageOffset = {
					x: resizeState.originalImageOffset.x * widthRatio,
					y: resizeState.originalImageOffset.y,
				};
			} else if (direction === "n" || direction === "s") {
				// Vertical edge - only adjust scaleY
				const heightRatio = newHeight / resizeState.startHeight;
				newScaleY = resizeState.originalScaleY * heightRatio;

				// Adjust Y offset proportionally
				newImageOffset = {
					x: resizeState.originalImageOffset.x,
					y: resizeState.originalImageOffset.y * heightRatio,
				};
			} else {
				// Corner resizing - adjust both scaleX and scaleY
				const widthRatio = newWidth / resizeState.startWidth;
				const heightRatio = newHeight / resizeState.startHeight;

				newScaleX = resizeState.originalScaleX * widthRatio;
				newScaleY = resizeState.originalScaleY * heightRatio;

				// Adjust both offsets proportionally
				newImageOffset = {
					x: resizeState.originalImageOffset.x * widthRatio,
					y: resizeState.originalImageOffset.y * heightRatio,
				};
			}

			return { newScaleX, newScaleY, newImageOffset };
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
				// Calculate which dimension changed more and use that as the primary
				const widthChange = Math.abs(newWidth - resizeState.startWidth);
				const heightChange = Math.abs(newHeight - resizeState.startHeight);

				if (widthChange > heightChange) {
					newHeight = newWidth / resizeState.aspectRatio;
				} else {
					newWidth = newHeight * resizeState.aspectRatio;
				}
			}

			// Calculate new image scale and offset based on the new container size
			const { newScaleX, newScaleY, newImageOffset } = calculateImageAdjustment(
				newWidth,
				newHeight,
				resizeState,
				resizeState.direction,
			);

			// Update template with new dimensions and image adjustments
			setTemplate((prev) => ({
				...prev,
				images: prev.images.map((img) => {
					if (img.id === resizeState.imageId) {
						const newPosition = { ...resizeState.startPosition };

						// Adjust position for handles that affect the top-left corner
						if (resizeState.direction.includes("w")) {
							newPosition.x =
								resizeState.startPosition.x +
								(resizeState.startWidth - newWidth);
						}
						if (resizeState.direction.includes("n")) {
							newPosition.y =
								resizeState.startPosition.y +
								(resizeState.startHeight - newHeight);
						}

						return {
							...img,
							width: Math.round(newWidth),
							height: Math.round(newHeight),
							position: newPosition,
							scaleX: newScaleX,
							scaleY: newScaleY,
							imageOffset: newImageOffset,
						};
					}
					return img;
				}),
			}));
		},
		[resizeState, scale, setTemplate, calculateImageAdjustment],
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
