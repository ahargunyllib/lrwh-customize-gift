import { cn } from "@/shared/lib/utils";
import type { ShapeElement } from "@/shared/types/element/shape";
import { useCallback, useEffect, useRef, useState } from "react";
import { useElementTransform } from "../../hooks/use-element-transform";

interface Props extends TemplateElementBaseProps {
	element: ShapeElement;
}

export interface TemplateElementBaseProps {
	isPreview?: boolean;
	isElementActive: boolean;
	scale: number;
	canvasSize?: { width: number; height: number };
	// optional properties
	isCustomizing?: boolean;
	isSnapping?: boolean;
	// event handlers
	toggleActive: (e: React.MouseEvent) => void;
	getSnapPosition?: (
		position: { x: number; y: number },
		width: number,
		height: number,
	) => { x: number; y: number };
	constrainToCanvas?: (
		position: { x: number; y: number },
		width: number,
		height: number,
	) => { x: number; y: number };
	canvasWidth: number;
	canvasHeight: number;
}

export default function TemplateShape(props: Props) {
	const {
		position,
		handleMouseDown,
		handleResizeMouseDown,
		handleRotateMouseDown,
	} = useElementTransform({
		enableRotationSnap: true,
		enableResizeSnap: true,
		enableGridSnap: true,
		id: props.element.id,
		initialPosition: props.element.position,
		width: props.element.width,
		height: props.element.height,
		scale: props.scale,
		getSnapPosition: props.getSnapPosition,
		constrainToCanvas: props.constrainToCanvas,
		onDrag: (newPos) => {
			props.element.position = newPos;
		},
		onResize: (newSize, newPos) => {
			props.element.width = newSize.width;
			props.element.height = newSize.height;
			props.element.position = newPos;
		},
		onRotate: (newAngle) => {
			props.element.rotation = newAngle;
		},
	});

	const scaledWidth = props.element.width * props.scale;
	const scaledHeight = props.element.height * props.scale;

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
		<div
			onMouseDown={
				props.isPreview
					? undefined
					: (e) => {
							handleMouseDown(e);
						}
			}
			onClick={
				props.isPreview
					? undefined
					: (e) => {
							e.stopPropagation();
							props.toggleActive(e);
						}
			}
			className={cn(
				"absolute",
				!props.isPreview && "cursor-move",
				props.isElementActive && !props.isPreview && "ring-1 ring-blue-500",
			)}
			style={{
				transform: `translate(${position.x * props.scale}px, ${position.y * props.scale}px) rotate(${props.element.rotation}deg)`,
				width: scaledWidth,
				height: scaledHeight,
				pointerEvents: props.isPreview ? "none" : "auto",
				zIndex: props.element.zIndex || 1,
			}}
		>
			<div className="w-full h-full">
				{/* Rectangle */}
				{props.element.type === "rectangle" && (
					<div
						className="w-full h-full"
						style={{
							backgroundColor: props.element.fill,
							border: `${props.element.borderWidth}px solid ${props.element.borderColor}`,
							borderRadius: `${props.element.borderRadius}px`,
							opacity: props.element.opacity / 100,
						}}
					/>
				)}
				{/* Circle */}
				{props.element.type === "circle" && (
					<div
						className="w-full h-full rounded-full"
						style={{
							backgroundColor: props.element.fill,
							border: `${props.element.borderWidth}px solid ${props.element.borderColor}`,
							opacity: props.element.opacity / 100,
						}}
					/>
				)}
				{/* Triangle */}
				{props.element.type === "triangle" && (
					<div
						className="w-0 h-0"
						style={{
							borderLeft: `${scaledWidth / 2}px solid transparent`,
							borderRight: `${scaledWidth / 2}px solid transparent`,
							borderBottom: `${scaledHeight}px solid ${props.element.fill}`,
							opacity: props.element.opacity / 100,
							transform: `translateY(${scaledHeight / -2}px)`,
						}}
					/>
				)}
			</div>

			{props.isElementActive && !props.isPreview && (
				<>
					{/* Resize Handles */}
					{["nw", "n", "ne", "e", "se", "s", "sw", "w"].map((pos) => (
						<div
							key={pos}
							onMouseDown={(e) => handleResizeMouseDown(e, pos)}
							className={cn(
								"absolute w-2 h-2 bg-white border border-blue-500",
								pos === "nw" && "-top-1 -left-1 cursor-nwse-resize",
								pos === "n" &&
									"-top-1 left-1/2 -translate-x-1/2 cursor-n-resize",
								pos === "ne" && "-top-1 -right-1 cursor-nesw-resize",
								pos === "e" &&
									"top-1/2 -right-1 -translate-y-1/2 cursor-ew-resize",
								pos === "se" && "-bottom-1 -right-1 cursor-nwse-resize",
								pos === "s" &&
									"-bottom-1 left-1/2 -translate-x-1/2 cursor-s-resize",
								pos === "sw" && "-bottom-1 -left-1 cursor-nesw-resize",
								pos === "w" &&
									"top-1/2 -left-1 -translate-y-1/2 cursor-ew-resize",
							)}
						/>
					))}

					{/* Rotate Handle */}
					<div
						onMouseDown={handleRotateMouseDown}
						className="absolute -top-8 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border border-blue-500 cursor-grab"
					>
						<div className="absolute top-full left-1/2 w-px h-4.5 bg-blue-500 -translate-x-1/2" />
					</div>
				</>
			)}
		</div>
	);
}
