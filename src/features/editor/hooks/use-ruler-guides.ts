"use client";

import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

interface Guide {
	id: string;
	orientation: "horizontal" | "vertical";
	position: number;
}

export function useRulerGuides(
	scale: number,
	canvasWidth: number,
	canvasHeight: number,
) {
	const [guides, setGuides] = useState<Guide[]>([]);
	const [isDraggingNew, setIsDraggingNew] = useState<{
		orientation: "horizontal" | "vertical";
		id: string;
	} | null>(null);

	// Create new guide
	const createGuide = useCallback(
		({
			orientation,
			position,
		}: { orientation: "horizontal" | "vertical"; position?: number }) => {
			const newGuide: Guide = {
				id: uuidv4(),
				orientation,
				position: position || 0,
			};

			setGuides((prev) => [...prev, newGuide]);
			setIsDraggingNew({ orientation, id: newGuide.id });
			return newGuide.id;
		},
		[],
	);

	// Update guide position
	const updateGuidePosition = useCallback((id: string, position: number) => {
		setGuides((prev) =>
			prev.map((guide) => (guide.id === id ? { ...guide, position } : guide)),
		);
	}, []);

	// Remove guide
	const removeGuide = useCallback((id: string) => {
		setGuides((prev) => prev.filter((guide) => guide.id !== id));
	}, []);

	// Handle mouse move for new guide being dragged from ruler
	useEffect(() => {
		if (!isDraggingNew) return;

		const handleMouseMove = (e: MouseEvent) => {
			const canvas = document.querySelector('[data-canvas="true"]');
			if (canvas) {
				const canvasRect = canvas.getBoundingClientRect();

				if (isDraggingNew.orientation === "horizontal") {
					const newY = (e.clientY - canvasRect.top) / scale;
					const constrainedY = Math.max(0, Math.min(canvasHeight, newY));
					updateGuidePosition(isDraggingNew.id, constrainedY);
				} else {
					const newX = (e.clientX - canvasRect.left) / scale;
					const constrainedX = Math.max(0, Math.min(canvasWidth, newX));
					updateGuidePosition(isDraggingNew.id, constrainedX);
				}
			}
		};

		const handleMouseUp = () => {
			setIsDraggingNew(null);
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDraggingNew, scale, canvasWidth, canvasHeight, updateGuidePosition]);

	return {
		guides,
		createGuide,
		updateGuidePosition,
		removeGuide,
	};
}
