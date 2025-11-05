"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface GuideLineProps {
	id: string;
	orientation: "horizontal" | "vertical";
	position: number;
	scale: number;
	canvasSize: number;
	onPositionChange: (id: string, position: number) => void;
	onRemove: (id: string) => void;
}

export default function GuideLine({
	id,
	orientation,
	position,
	scale,
	canvasSize,
	onPositionChange,
	onRemove,
}: GuideLineProps) {
	const [isDragging, setIsDragging] = useState(false);

	useEffect(() => {
		if (!isDragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			const canvas = document.querySelector('[data-canvas="true"]');
			if (canvas) {
				const canvasRect = canvas.getBoundingClientRect();

				if (orientation === "horizontal") {
					const newY = (e.clientY - canvasRect.top) / scale;
					const constrainedY = Math.max(0, Math.min(canvasSize, newY));
					onPositionChange(id, constrainedY);
				} else {
					const newX = (e.clientX - canvasRect.left) / scale;
					const constrainedX = Math.max(0, Math.min(canvasSize, newX));
					onPositionChange(id, constrainedX);
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
	}, [isDragging, orientation, scale, canvasSize, onPositionChange, id]);

	const displayPosition = Math.round(position);
	const cmPosition = (position / 40).toFixed(1);

	if (orientation === "horizontal") {
		return (
			<>
				{/* Guide line */}
				<div
					className={`absolute left-0 right-0 h-px bg-cyan-500 z-40 pointer-events-auto ${
						isDragging ? "cursor-grabbing" : "cursor-ns-resize"
					}`}
					style={{
						top: position * scale,
						boxShadow: "0 0 3px rgba(6, 182, 212, 0.6)",
					}}
					onMouseDown={(e) => {
						e.preventDefault();
						e.stopPropagation();
						setIsDragging(true);
					}}
				/>
				<div
					className="absolute left-2 px-2 py-1 text-xs font-medium text-white bg-cyan-500 rounded shadow-md z-50 flex items-center gap-1 pointer-events-auto"
					style={{
						top: position * scale - 20,
					}}
				>
					<span>
						{displayPosition}px ({cmPosition}cm)
					</span>
					<button
						type="button"
						className="hover:bg-cyan-600 rounded p-0.5 transition-colors"
						onClick={(e) => {
							e.stopPropagation();
							onRemove(id);
						}}
					>
						<X className="h-3 w-3" />
					</button>
				</div>
			</>
		);
	}

	return (
		<>
			{/* Guide line */}
			<div
				className={`absolute top-0 bottom-0 w-px bg-pink-500 z-40 pointer-events-auto ${
					isDragging ? "cursor-grabbing" : "cursor-ew-resize"
				}`}
				style={{
					left: position * scale,
					boxShadow: "0 0 3px rgba(236, 72, 153, 0.6)",
				}}
				onMouseDown={(e) => {
					e.preventDefault();
					e.stopPropagation();
					setIsDragging(true);
				}}
			/>

			<div
				className="absolute top-2 px-2 py-1 text-xs font-medium text-white bg-pink-500 rounded shadow-md z-50 flex items-center gap-1 pointer-events-auto"
				style={{
					left: position * scale + 5,
				}}
			>
				<span>
					{displayPosition}px ({cmPosition}cm)
				</span>
				<button
					type="button"
					className="hover:bg-pink-600 rounded p-0.5 transition-colors"
					onClick={(e) => {
						e.stopPropagation();
						onRemove(id);
					}}
				>
					<X className="h-3 w-3" />
				</button>
			</div>
		</>
	);
}
