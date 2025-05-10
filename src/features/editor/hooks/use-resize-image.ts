"use client";
import { useEffect, useState } from "react";
import type React from "react";

import type { TemplateData } from "@/shared/types/template";

interface UseResizeImageProps {
	setTemplate: React.Dispatch<React.SetStateAction<TemplateData>>;
	scale: number;
}

export function useResizeImage({ setTemplate, scale }: UseResizeImageProps) {
	const [resizingImageId, setResizingImageId] = useState<string | null>(null);
	const [resizeDirection, setResizeDirection] = useState<string | null>(null);
	const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
	const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });

	// Handle image resize
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (!resizingImageId) return;

		const handleMouseMove = (e: MouseEvent) => {
			const canvas = document.querySelector('[data-canvas="true"]');
			if (!canvas) return;

			const canvasRect = canvas.getBoundingClientRect();
			const mouseX = (e.clientX - canvasRect.left) / scale;
			const mouseY = (e.clientY - canvasRect.top) / scale;

			setTemplate((prev) => {
				return {
					...prev,
					images: prev.images.map((img) => {
						if (img.id !== resizingImageId) return img;

						// Get the original values
						const originalX = img.position.x;
						const originalY = img.position.y;
						const originalWidth = initialSize.width;
						const originalHeight = initialSize.height;

						// Calculate new dimensions and position based on resize direction
						let newWidth = originalWidth;
						let newHeight = originalHeight;
						let newX = originalX;
						let newY = originalY;

						// Handle different resize directions
						switch (resizeDirection) {
							case "e": // right
								newWidth = Math.max(50, mouseX - originalX);
								break;
							case "w": // left
								newWidth = Math.max(50, originalX + originalWidth - mouseX);
								newX = mouseX;
								break;
							case "s": // bottom
								newHeight = Math.max(50, mouseY - originalY);
								break;
							case "n": // top
								newHeight = Math.max(50, originalY + originalHeight - mouseY);
								newY = mouseY;
								break;
							case "se": // bottom-right
								newWidth = Math.max(50, mouseX - originalX);
								newHeight = Math.max(50, mouseY - originalY);
								break;
							case "sw": // bottom-left
								newWidth = Math.max(50, originalX + originalWidth - mouseX);
								newX = mouseX;
								newHeight = Math.max(50, mouseY - originalY);
								break;
							case "ne": // top-right
								newWidth = Math.max(50, mouseX - originalX);
								newHeight = Math.max(50, originalY + originalHeight - mouseY);
								newY = mouseY;
								break;
							case "nw": // top-left
								newWidth = Math.max(50, originalX + originalWidth - mouseX);
								newX = mouseX;
								newHeight = Math.max(50, originalY + originalHeight - mouseY);
								newY = mouseY;
								break;
						}

						return {
							...img,
							width: newWidth,
							height: newHeight,
							position: { x: newX, y: newY },
						};
					}),
				};
			});
		};

		const handleMouseUp = () => {
			setResizingImageId(null);
			setResizeDirection(null);
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [
		resizingImageId,
		resizeDirection,
		initialSize,
		initialMousePos,
		scale,
		setTemplate,
	]);

	const handleResizeStart = (
		e: React.MouseEvent,
		imageId: string,
		direction: string,
		width: number,
		height: number,
	) => {
		e.stopPropagation();
		setResizingImageId(imageId);
		setResizeDirection(direction);
		setInitialSize({ width, height });
		setInitialMousePos({ x: e.clientX, y: e.clientY });
	};

	return {
		resizingImageId,
		setResizingImageId,
		resizeDirection,
		setResizeDirection,
		initialSize,
		setInitialSize,
		initialMousePos,
		setInitialMousePos,
		handleResizeStart,
	};
}
