"use client";
import { useEffect, useState } from "react";
import type React from "react";

interface UseElementDragProps {
	id: string;
	type: "image" | "text";
	scale: number;
	draggable: boolean;
}

export function useElementDrag({
	id,
	type,
	scale,
	draggable,
}: UseElementDragProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

	const handleMouseDown = (e: React.MouseEvent) => {
		if (draggable) {
			e.preventDefault();
			const rect = e.currentTarget.getBoundingClientRect();
			setDragOffset({
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			});
			setIsDragging(true);
		}
	};

	useEffect(() => {
		if (!isDragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			if (isDragging) {
				const canvas = document.querySelector('[data-canvas="true"]');
				if (canvas) {
					const canvasRect = canvas.getBoundingClientRect();
					const newX = (e.clientX - canvasRect.left - dragOffset.x) / scale;
					const newY = (e.clientY - canvasRect.top - dragOffset.y) / scale;

					document.dispatchEvent(
						new CustomEvent("elementMove", {
							detail: {
								id,
								type,
								position: { x: newX, y: newY },
							},
						}),
					);
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
	}, [isDragging, dragOffset, id, type, scale]);

	return {
		isDragging,
		handleMouseDown,
	};
}
