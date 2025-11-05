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
}

interface Guide {
	id: string;
	orientation: "horizontal" | "vertical";
	position: number;
}

export default function RulerContainer({
	scale,
	canvasWidth,
	canvasHeight,
	children,
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
		<div className="relative">
			{/* Corner square where rulers meet */}
			<div
				className="absolute top-0 left-0 bg-gray-300 border-r border-b border-gray-400 z-50"
				style={{
					width: rulerSize,
					height: rulerSize,
				}}
			/>

			{/* Horizontal ruler bar (top) */}
			<div
				className="absolute z-50"
				style={{
					left: rulerSize,
					top: 0,
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
					left: 0,
					top: rulerSize,
				}}
			>
				<RulerBar
					orientation="vertical"
					length={canvasHeight}
					scale={scale}
					onDragStart={(e) => handleRulerDragStart(e, "vertical")}
				/>
			</div>

			{/* Canvas with offset for rulers */}
			<div
				className="relative"
				style={{
					marginLeft: rulerSize,
					marginTop: rulerSize,
				}}
			>
				{children}

				{/* Guide lines */}
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
		</div>
	);
}
