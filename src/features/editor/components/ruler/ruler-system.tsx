"use client";

import { useCallback } from "react";
import RulerBar from "./ruler-bar";

interface RulerSystemProps {
	scale: number;
	canvasWidth: number;
	canvasHeight: number;
	canvasOffset: { x: number; y: number };
	containerRef: React.RefObject<HTMLDivElement>;
	onCreateGuide: (orientation: "horizontal" | "vertical") => void;
}

export default function RulerSystem({
	scale,
	canvasWidth,
	canvasHeight,
	canvasOffset,
	containerRef,
	onCreateGuide,
}: RulerSystemProps) {
	const rulerSize = 30;

	// Calculate canvas position in viewport
	const getCanvasRect = useCallback(() => {
		if (!containerRef.current) return null;
		const containerRect = containerRef.current.getBoundingClientRect();
		const canvasLeft =
			containerRect.left +
			containerRect.width / 2 -
			(canvasWidth * scale) / 2 +
			canvasOffset.x;
		const canvasTop =
			containerRect.top +
			containerRect.height / 2 -
			(canvasHeight * scale) / 2 +
			canvasOffset.y;

		return {
			left: canvasLeft,
			top: canvasTop,
			width: canvasWidth * scale,
			height: canvasHeight * scale,
		};
	}, [containerRef, canvasWidth, canvasHeight, scale, canvasOffset]);

	// Handle drag from ruler to create new guide
	const handleRulerDragStart = (
		e: React.MouseEvent,
		orientation: "horizontal" | "vertical",
	) => {
		e.preventDefault();
		onCreateGuide(orientation);
	};

	const canvasRect = getCanvasRect();
	if (!canvasRect) return null;

	return (
		<>
			{/* Corner square where rulers meet */}
			<div
				className="absolute bg-gray-300 border-r border-b border-gray-400 z-50 pointer-events-none"
				style={{
					width: rulerSize,
					height: rulerSize,
					left: 0,
					top: 0,
				}}
			/>

			{/* Horizontal ruler bar (top) - fixed to viewport */}
			<div
				className="absolute z-40 overflow-hidden"
				style={{
					left: rulerSize,
					top: 0,
					right: 0,
					height: rulerSize,
				}}
			>
				<div
					style={{
						position: "relative",
						left:
							canvasRect.left -
							(containerRef.current?.getBoundingClientRect().left || 0) -
							rulerSize,
					}}
				>
					<RulerBar
						orientation="horizontal"
						length={canvasWidth}
						scale={scale}
						onDragStart={(e) => handleRulerDragStart(e, "horizontal")}
					/>
				</div>
			</div>

			{/* Vertical ruler bar (left) - fixed to viewport */}
			<div
				className="absolute z-40 overflow-hidden"
				style={{
					left: 0,
					top: rulerSize,
					bottom: 0,
					width: rulerSize,
				}}
			>
				<div
					style={{
						position: "relative",
						top:
							canvasRect.top -
							(containerRef.current?.getBoundingClientRect().top || 0) -
							rulerSize,
					}}
				>
					<RulerBar
						orientation="vertical"
						length={canvasHeight}
						scale={scale}
						onDragStart={(e) => handleRulerDragStart(e, "vertical")}
					/>
				</div>
			</div>
		</>
	);
}
