"use client";

import { X } from "lucide-react";
import { forwardRef, useImperativeHandle } from "react";
import { useRulerDrag } from "../../hooks/use-ruler-drag";

interface VerticalRulerProps {
	scale: number;
	canvasWidth: number;
	canvasHeight: number;
	onRemove?: () => void;
}

const VerticalRuler = forwardRef<
	{ setPosition: (pos: number) => void },
	VerticalRulerProps
>(({ scale, canvasWidth, canvasHeight, onRemove }, ref) => {
	const { isDragging, position, handleMouseDown, removeRuler, setPosition } =
		useRulerDrag({
			orientation: "vertical",
			scale,
			canvasSize: canvasWidth,
		});

	useImperativeHandle(ref, () => ({
		setPosition,
	}));

	const handleRemove = () => {
		removeRuler();
		onRemove?.();
	};

	if (position === null) return null;

	const displayPosition = Math.round(position);
	const cmPosition = (position / 40).toFixed(2); // 1cm = 40px

	return (
		<>
			{/* The guide line */}
			<div
				className={`absolute top-0 bottom-0 w-px bg-cyan-500 pointer-events-none z-50 ${
					isDragging ? "opacity-100" : "opacity-75"
				}`}
				style={{
					left: position * scale,
					boxShadow: "0 0 4px rgba(6, 182, 212, 0.8)",
				}}
			/>

			{/* The draggable handle */}
			<div
				className={`absolute top-0 w-24 flex flex-col items-center justify-between py-2 px-1 text-xs font-medium text-white bg-cyan-500 rounded-b z-50 ${
					isDragging ? "cursor-grabbing" : "cursor-grab"
				} hover:bg-cyan-600 transition-colors shadow-md`}
				style={{
					left: position * scale - 48,
					minHeight: "80px",
				}}
				onMouseDown={handleMouseDown}
			>
				<span className="select-none text-center">
					{displayPosition}px
					<br />({cmPosition}cm)
				</span>
				<button
					type="button"
					className="hover:bg-cyan-700 rounded p-0.5 transition-colors"
					onClick={(e) => {
						e.stopPropagation();
						handleRemove();
					}}
				>
					<X className="h-3 w-3" />
				</button>
			</div>
		</>
	);
});

VerticalRuler.displayName = "VerticalRuler";

export default VerticalRuler;
