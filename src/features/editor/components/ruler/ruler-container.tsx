"use client";

import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import GuideLine from "./guide-line";
import RulerBar from "./ruler-bar";

interface RulerContainerProps {
	scale: number;
	canvasWidth: number;
	canvasHeight: number;
	children: React.ReactNode;
	canvasOffset?: { x: number; y: number };
}

interface Guide {
	id: string;
	orientation: "horizontal" | "vertical";
	position: number; // in unscaled canvas coordinates
}

export default function RulerContainer({
	scale,
	canvasWidth,
	canvasHeight,
	children,
	canvasOffset = { x: 0, y: 0 },
}: RulerContainerProps) {
	const [guides, setGuides] = useState<Guide[]>([]);
	const [isDraggingNew, setIsDraggingNew] = useState<{
		orientation: "horizontal" | "vertical";
		id: string;
	} | null>(null);

	const rulerSize = 30;

	// Handle drag from ruler to create new guide
	const handleRulerDragStart = (
		e: React.MouseEvent,
		orientation: "horizontal" | "vertical",
	) => {
		e.preventDefault();
		const newGuide: Guide = {
			id: uuidv4(),
			orientation,
			position: 0,
		};

		setGuides((prev) => [...prev, newGuide]);
		setIsDraggingNew({ orientation, id: newGuide.id });
	};

	// Update guide position
	const handleGuidePositionChange = useCallback(
		(id: string, position: number) => {
			setGuides((prev) =>
				prev.map((guide) => (guide.id === id ? { ...guide, position } : guide)),
			);
		},
		[],
	);

	// Remove guide
	const handleGuideRemove = useCallback((id: string) => {
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
					handleGuidePositionChange(isDraggingNew.id, constrainedY);
				} else {
					const newX = (e.clientX - canvasRect.left) / scale;
					const constrainedX = Math.max(0, Math.min(canvasWidth, newX));
					handleGuidePositionChange(isDraggingNew.id, constrainedX);
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
	}, [
		isDraggingNew,
		scale,
		canvasWidth,
		canvasHeight,
		handleGuidePositionChange,
	]);

	return (
		<div className="relative w-full h-full">
			{/* Corner square where rulers meet - positioned relative to viewport center */}
			<div
				className="absolute bg-gray-300 border-r border-b border-gray-400 z-50"
				style={{
					width: rulerSize,
					height: rulerSize,
					left: `calc(50% - ${(canvasWidth * scale) / 2}px - ${rulerSize}px + ${canvasOffset.x}px)`,
					top: `calc(50% - ${(canvasHeight * scale) / 2}px - ${rulerSize}px + ${canvasOffset.y}px)`,
				}}
			/>

			{/* Horizontal ruler bar (top) */}
			<div
				className="absolute z-50"
				style={{
					left: `calc(50% - ${(canvasWidth * scale) / 2}px + ${canvasOffset.x}px)`,
					top: `calc(50% - ${(canvasHeight * scale) / 2}px - ${rulerSize}px + ${canvasOffset.y}px)`,
				}}
			>
				<RulerBar
					orientation="horizontal"
					length={canvasWidth}
					scale={scale}
					onDragStart={(e) => handleRulerDragStart(e, "horizontal")}
				/>
			</div>

			{/* Vertical ruler bar (left) */}
			<div
				className="absolute z-50"
				style={{
					left: `calc(50% - ${(canvasWidth * scale) / 2}px - ${rulerSize}px + ${canvasOffset.x}px)`,
					top: `calc(50% - ${(canvasHeight * scale) / 2}px + ${canvasOffset.y}px)`,
				}}
			>
				<RulerBar
					orientation="vertical"
					length={canvasHeight}
					scale={scale}
					onDragStart={(e) => handleRulerDragStart(e, "vertical")}
				/>
			</div>

			{/* Guide lines - positioned relative to canvas */}
			<div
				className="absolute pointer-events-none"
				style={{
					left: `calc(50% - ${(canvasWidth * scale) / 2}px + ${canvasOffset.x}px)`,
					top: `calc(50% - ${(canvasHeight * scale) / 2}px + ${canvasOffset.y}px)`,
					width: canvasWidth * scale,
					height: canvasHeight * scale,
				}}
			>
				{guides.map((guide) => (
					<GuideLine
						key={guide.id}
						id={guide.id}
						orientation={guide.orientation}
						position={guide.position}
						scale={scale}
						canvasSize={
							guide.orientation === "horizontal" ? canvasHeight : canvasWidth
						}
						onPositionChange={handleGuidePositionChange}
						onRemove={handleGuideRemove}
					/>
				))}
			</div>

			{/* Canvas content */}
			{children}
		</div>
	);
}
