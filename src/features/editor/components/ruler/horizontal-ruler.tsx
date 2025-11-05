"use client";

import { X } from "lucide-react";
import { forwardRef, useImperativeHandle } from "react";
import { useRulerDrag } from "../../hooks/use-ruler-drag";

interface HorizontalRulerProps {
	scale: number;
	canvasWidth: number;
	canvasHeight: number;
	onRemove?: () => void;
}

const HorizontalRuler = forwardRef<
	{ setPosition: (pos: number) => void },
	HorizontalRulerProps
>(({ scale, canvasWidth, canvasHeight, onRemove }, ref) => {
	const { isDragging, position, handleMouseDown, removeRuler, setPosition } =
		useRulerDrag({
			orientation: "horizontal",
			scale,
			canvasSize: canvasHeight,
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
				className={`absolute left-0 right-0 h-px bg-pink-500 pointer-events-none z-50 ${
					isDragging ? "opacity-100" : "opacity-75"
				}`}
				style={{
					top: position * scale,
					boxShadow: "0 0 4px rgba(236, 72, 153, 0.8)",
				}}
			/>

			{/* The draggable handle */}
			<div
				className={`absolute left-0 h-6 flex items-center justify-between px-2 text-xs font-medium text-white bg-pink-500 rounded-r z-50 ${
					isDragging ? "cursor-grabbing" : "cursor-grab"
				} hover:bg-pink-600 transition-colors shadow-md`}
				style={{
					top: position * scale - 12,
					minWidth: "120px",
				}}
				onMouseDown={handleMouseDown}
			>
				<span className="select-none">
					{displayPosition}px ({cmPosition}cm)
				</span>
				<button
					type="button"
					className="ml-2 hover:bg-pink-700 rounded p-0.5 transition-colors"
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

HorizontalRuler.displayName = "HorizontalRuler";

export default HorizontalRuler;
