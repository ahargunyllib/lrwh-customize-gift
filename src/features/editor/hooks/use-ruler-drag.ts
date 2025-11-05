"use client";
import { useEffect, useState } from "react";

interface UseRulerDragProps {
	orientation: "horizontal" | "vertical";
	scale: number;
	canvasSize: number; // width for vertical, height for horizontal
	onPositionChange?: (position: number | null) => void;
}

export function useRulerDrag({
	orientation,
	scale,
	canvasSize,
	onPositionChange,
}: UseRulerDragProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [position, setPosition] = useState<number | null>(null); // null means no ruler placed

	const handleMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	};

	const removeRuler = () => {
		setPosition(null);
		onPositionChange?.(null);
	};

	useEffect(() => {
		if (!isDragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			const canvas = document.querySelector('[data-canvas="true"]');
			if (canvas) {
				const canvasRect = canvas.getBoundingClientRect();

				if (orientation === "horizontal") {
					const newY = (e.clientY - canvasRect.top) / scale;
					const constrainedY = Math.max(0, Math.min(canvasSize, newY));
					setPosition(constrainedY);
					onPositionChange?.(constrainedY);
				} else {
					const newX = (e.clientX - canvasRect.left) / scale;
					const constrainedX = Math.max(0, Math.min(canvasSize, newX));
					setPosition(constrainedX);
					onPositionChange?.(constrainedX);
				}
			}
		};

		const handleMouseUp = () => {
			setIsDragging(false);
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDragging, orientation, scale, canvasSize, onPositionChange]);

	return {
		isDragging,
		position,
		handleMouseDown,
		removeRuler,
		setPosition,
	};
}
