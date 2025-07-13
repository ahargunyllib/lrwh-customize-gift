"use client";
import type { ImageElement } from "@/shared/types/template";
import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";

interface TemplateImageProps {
	image: ImageElement;
	isActive: boolean;
	onClick: (e: React.MouseEvent) => void;
	scale?: number;
	isCustomizing?: boolean;
	onResizeStart?: (
		e: React.MouseEvent,
		id: string,
		direction: string,
		width: number,
		height: number,
	) => void;
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
	isSnapping?: boolean;
	canvasWidth?: number;
	canvasHeight?: number;
}

export default function TemplateImage({
	image,
	isActive,
	onClick,
	scale = 1,
	isCustomizing = false,
	onResizeStart,
	getSnapPosition,
	constrainToCanvas,
	isSnapping = false,
	canvasWidth = 0,
	canvasHeight = 0,
}: TemplateImageProps) {
	const [isDragOver, setIsDragOver] = useState(false);
	const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const dropZoneRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

	const clearDragTimeout = useCallback(() => {
		if (dragTimeoutRef.current) {
			clearTimeout(dragTimeoutRef.current);
			dragTimeoutRef.current = null;
		}
	}, []);

	useEffect(() => () => clearDragTimeout(), [clearDragTimeout]);

	const handleDragEnter = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		clearDragTimeout();
		if (e.dataTransfer.types.includes("Files")) setIsDragOver(true);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		clearDragTimeout();
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (
			dropZoneRef.current &&
			!dropZoneRef.current.contains(e.relatedTarget as Node)
		) {
			dragTimeoutRef.current = setTimeout(() => setIsDragOver(false), 50);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		clearDragTimeout();
		setIsDragOver(false);
		const file = e.dataTransfer.files[0];
		if (file?.type.startsWith("image/")) {
			const reader = new FileReader();
			reader.onload = (ev) => {
				if (ev.target?.result) {
					document.dispatchEvent(
						new CustomEvent("imageReplace", {
							detail: { id: image.id, src: ev.target.result },
						}),
					);
				}
			};
			reader.readAsDataURL(file);
			onClick(e);
		}
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		if (image.draggable) {
			e.preventDefault();
			const canvas = document.querySelector('[data-canvas="true"]');
			if (canvas) {
				const canvasRect = canvas.getBoundingClientRect();
				setDragOffset({
					x: (e.clientX - canvasRect.left) / scale - image.position.x,
					y: (e.clientY - canvasRect.top) / scale - image.position.y,
				});
				setIsDragging(true);
			}
		}
	};

	useEffect(() => {
		if (!isDragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			if (isDragging) {
				const canvas = document.querySelector('[data-canvas="true"]');
				if (canvas) {
					const canvasRect = canvas.getBoundingClientRect();
					const newX = (e.clientX - canvasRect.left) / scale - dragOffset.x;
					const newY = (e.clientY - canvasRect.top) / scale - dragOffset.y;

					let newPosition = { x: newX, y: newY };

					const isMovingSlowly =
						e.movementX * e.movementX + e.movementY * e.movementY < 25;

					if (getSnapPosition && isSnapping && isMovingSlowly) {
						newPosition = getSnapPosition(
							newPosition,
							image.width,
							image.height,
						);
					}

					if (constrainToCanvas) {
						newPosition = constrainToCanvas(
							newPosition,
							image.width,
							image.height,
						);
					}

					document.dispatchEvent(
						new CustomEvent("elementMove", {
							detail: {
								id: image.id,
								type: "image",
								position: newPosition,
							},
						}),
					);
				}
			}
		};

		const handleMouseUp = () => setIsDragging(false);

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [
		isDragging,
		dragOffset,
		image.id,
		scale,
		getSnapPosition,
		constrainToCanvas,
		isSnapping,
		image.width,
		image.height,
	]);

	const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
		e.stopPropagation();
		onResizeStart?.(e, image.id, direction, image.width, image.height);
	};

	const getPositionStyle = () => {
		const positionStyle: React.CSSProperties = {
			left: image.position.x * scale,
			top: image.position.y * scale,
		};

		if (image.centerX && canvasWidth) {
			positionStyle.left = ((canvasWidth - image.width) / 2) * scale;
		}
		if (image.centerY && canvasHeight) {
			positionStyle.top = ((canvasHeight - image.height) / 2) * scale;
		}
		return positionStyle;
	};

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
		<div
			ref={dropZoneRef}
			className={`absolute ${isActive ? "ring-2 ring-blue-500" : ""} ${
				isDragOver ? "ring-2 ring-green-500" : ""
			}`}
			style={{
				...getPositionStyle(),
				width: image.width * scale,
				height: image.height * scale,
			}}
			onClick={onClick}
			onDragEnter={handleDragEnter}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			onMouseDown={handleMouseDown}
		>
			<div
				className="w-full h-full overflow-hidden"
				style={{
					borderRadius: image.borderRadius ?? 0,
				}}
			>
				<img
					src={image.src || "https://placecats.com/300/200"}
					alt="Template element"
					className="w-full h-full object-cover pointer-events-none"
					draggable={false}
					style={{
						filter: image.grayscale ? "grayscale(1)" : "none",
					}}
				/>
			</div>

			{/* Drag drop overlay */}
			{isDragOver && (
				<div className="absolute inset-0 bg-green-500/20 flex items-center justify-center pointer-events-none">
					<div className="bg-white/80 px-2 py-1 rounded text-xs font-medium">
						Drop to replace
					</div>
				</div>
			)}

			{/* Resize Handles */}
			{isActive && isCustomizing && (
				<>
					{/* Horizontal edges */}
					<div
						className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 border border-white cursor-w-resize"
						onMouseDown={(e) => handleResizeMouseDown(e, "w")}
					/>
					<div
						className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 border border-white cursor-e-resize"
						onMouseDown={(e) => handleResizeMouseDown(e, "e")}
					/>

					{/* Vertical edges */}
					<div
						className="absolute left-1/2 -top-1 transform -translate-x-1/2 w-3 h-3 rounded-full bg-blue-500 border border-white cursor-n-resize"
						onMouseDown={(e) => handleResizeMouseDown(e, "n")}
					/>
					<div
						className="absolute left-1/2 -bottom-1 transform -translate-x-1/2 w-3 h-3 rounded-full bg-blue-500 border border-white cursor-s-resize"
						onMouseDown={(e) => handleResizeMouseDown(e, "s")}
					/>

					{/* Corners */}
					<div
						className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-blue-500 border border-white cursor-nw-resize"
						onMouseDown={(e) => handleResizeMouseDown(e, "nw")}
					/>
					<div
						className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border border-white cursor-ne-resize"
						onMouseDown={(e) => handleResizeMouseDown(e, "ne")}
					/>
					<div
						className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-blue-500 border border-white cursor-sw-resize"
						onMouseDown={(e) => handleResizeMouseDown(e, "sw")}
					/>
					<div
						className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border border-white cursor-se-resize"
						onMouseDown={(e) => handleResizeMouseDown(e, "se")}
					/>
				</>
			)}
		</div>
	);
}
