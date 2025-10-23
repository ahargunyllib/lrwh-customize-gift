"use client";
import type { ActiveElement } from "@/shared/types/element";
import type { ImageElement, TemplateData } from "@/shared/types/template";
import type { DragEvent } from "react";
import { v4 as uuidv4 } from "uuid";

interface Params {
	isCustomizing: boolean;
	scale: number;
	setTemplate: React.Dispatch<React.SetStateAction<TemplateData>>;
	setActiveElement: React.Dispatch<React.SetStateAction<ActiveElement>>;
}

export function useCanvasDrop({
	isCustomizing,
	scale,
	setTemplate,
	setActiveElement,
}: Params) {
	const handleCanvasDrop = (e: DragEvent) => {
		e.preventDefault();

		if (!isCustomizing || !e.dataTransfer.files?.[0]) return;
		const file = e.dataTransfer.files[0];
		if (!file.type.startsWith("image/")) return;

		const reader = new FileReader();
		reader.onload = (ev) => {
			if (!ev.target?.result) return;
			const canvasRect = (
				e.currentTarget as HTMLElement
			).getBoundingClientRect();
			const x = (e.clientX - canvasRect.left) / scale;
			const y = (e.clientY - canvasRect.top) / scale;

			const newImage: ImageElement = {
				id: uuidv4(),
				type: "image",
				src: ev.target.result as string,
				position: { x, y },
				width: 200,
				height: 200,
				draggable: true,
				zIndex: 0,
			};

			setTemplate((prev) => ({ ...prev, images: [...prev.images, newImage] }));
			setActiveElement({ id: newImage.id, type: "image" });
		};
		reader.readAsDataURL(file);
	};

	const handleCanvasDragOver = (e: DragEvent) => e.preventDefault();

	return { handleCanvasDrop, handleCanvasDragOver };
}
