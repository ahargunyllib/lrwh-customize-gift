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
	layerIndex: number;
}

interface CropArea {
	x: number;
	y: number;
	width: number;
	height: number;
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
	layerIndex,
}: TemplateImageProps) {
	const [isDragOver, setIsDragOver] = useState(false);
	const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const dropZoneRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

	// Crop overlay states
	const [isCropMode, setIsCropMode] = useState(false);
	const [originalDimensions, setOriginalDimensions] = useState<{
		width: number;
		height: number;
	} | null>(null);
	const [cropArea, setCropArea] = useState<CropArea>({
		x: 0,
		y: 0,
		width: 0,
		height: 0,
	});
	const [isDraggingCrop, setIsDraggingCrop] = useState(false);
	const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
	const [initialCropArea, setInitialCropArea] = useState<CropArea>({
		x: 0,
		y: 0,
		width: 0,
		height: 0,
	});

	const [isResizingCrop, setIsResizingCrop] = useState(false);
	const [resizeDirection, setResizeDirection] = useState<string>("");
	const [cropAspectRatio, setCropAspectRatio] = useState<number>(1);

	// Crop overlay positioning
	const cropOverlayRef = useRef<HTMLDivElement>(null);
	const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0 });
	const [imageDisplayScale, setImageDisplayScale] = useState(1);

	const clearDragTimeout = useCallback(() => {
		if (dragTimeoutRef.current) {
			clearTimeout(dragTimeoutRef.current);
			dragTimeoutRef.current = null;
		}
	}, []);

	useEffect(() => () => clearDragTimeout(), [clearDragTimeout]);

	// Calculate crop area from current image settings
	const calculateCurrentCropArea = useCallback(() => {
		if (!originalDimensions)
			return { x: 0, y: 0, width: image.width, height: image.height };

		const imageOffset = image.imageOffset || { x: 0, y: 0 };
		const imageScale = image.imageScale || 1;

		// Calculate what part of the original image is currently visible
		// Convert container coordinates back to original image coordinates
		const visibleX = Math.max(0, -imageOffset.x / imageScale);
		const visibleY = Math.max(0, -imageOffset.y / imageScale);

		// Calculate the visible dimensions in original image coordinates
		const maxVisibleWidth = originalDimensions.width - visibleX;
		const maxVisibleHeight = originalDimensions.height - visibleY;
		const containerWidthInOriginal = image.width / imageScale;
		const containerHeightInOriginal = image.height / imageScale;

		const visibleWidth = Math.min(maxVisibleWidth, containerWidthInOriginal);
		const visibleHeight = Math.min(maxVisibleHeight, containerHeightInOriginal);

		return {
			x: visibleX,
			y: visibleY,
			width: Math.max(0, visibleWidth),
			height: Math.max(0, visibleHeight),
		};
	}, [
		originalDimensions,
		image.width,
		image.height,
		image.imageOffset,
		image.imageScale,
	]);

	// Initialize crop area when entering crop mode
	useEffect(() => {
		if (isCropMode && originalDimensions) {
			const currentCrop = calculateCurrentCropArea();
			setCropArea(currentCrop);

			setCropAspectRatio(currentCrop.width / currentCrop.height);

			// Calculate display scale for the overlay
			const maxWidth = Math.min(600, window.innerWidth * 0.6);
			const maxHeight = Math.min(500, window.innerHeight * 0.6);

			const scaleX = maxWidth / originalDimensions.width;
			const scaleY = maxHeight / originalDimensions.height;
			const displayScale = Math.min(scaleX, scaleY, 0.8); // Limit max scale

			setImageDisplayScale(displayScale);
		}
	}, [isCropMode, originalDimensions, calculateCurrentCropArea]);

	// Load original image dimensions and set default fill mode
	const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
		const img = e.currentTarget;
		setOriginalDimensions({
			width: img.naturalWidth,
			height: img.naturalHeight,
		});

		// Initialize image settings if not set - DEFAULT TO FILL MODE
		if (!image.imageOffset && !image.imageScale) {
			const containerWidth = image.width;
			const containerHeight = image.height;
			const imageWidth = img.naturalWidth;
			const imageHeight = img.naturalHeight;

			// Calculate scale to fill the container (cover behavior)
			const scaleX = containerWidth / imageWidth;
			const scaleY = containerHeight / imageHeight;
			const fillScale = Math.max(scaleX, scaleY); // Use max for fill/cover

			// Calculate the scaled dimensions
			const scaledWidth = imageWidth * fillScale;
			const scaledHeight = imageHeight * fillScale;

			// Center the image in the container
			const offsetX = (containerWidth - scaledWidth) / 2;
			const offsetY = (containerHeight - scaledHeight) / 2;

			// Dispatch initial settings with fill behavior
			document.dispatchEvent(
				new CustomEvent("imageAdjust", {
					detail: {
						id: image.id,
						imageOffset: { x: offsetX, y: offsetY },
						imageScale: fillScale,
					},
				}),
			);
		}
	};

	// Handle image replacement (drag & drop or file select) with fill mode
	const handleImageReplace = (newImageSrc: string) => {
		// Create a temporary image to get dimensions
		const tempImg = new Image();
		tempImg.onload = () => {
			const containerWidth = image.width;
			const containerHeight = image.height;
			const imageWidth = tempImg.naturalWidth;
			const imageHeight = tempImg.naturalHeight;

			// Calculate scale to fill the container
			const scaleX = containerWidth / imageWidth;
			const scaleY = containerHeight / imageHeight;
			const fillScale = Math.max(scaleX, scaleY);

			// Calculate the scaled dimensions
			const scaledWidth = imageWidth * fillScale;
			const scaledHeight = imageHeight * fillScale;

			// Center the image in the container
			const offsetX = (containerWidth - scaledWidth) / 2;
			const offsetY = (containerHeight - scaledHeight) / 2;

			// Update image source and settings
			document.dispatchEvent(
				new CustomEvent("imageReplace", {
					detail: {
						id: image.id,
						src: newImageSrc,
						imageOffset: { x: offsetX, y: offsetY },
						imageScale: fillScale,
					},
				}),
			);

			// Update original dimensions for the new image
			setOriginalDimensions({
				width: imageWidth,
				height: imageHeight,
			});
		};
		tempImg.src = newImageSrc;
	};

	// Get current image style for display
	const getImageStyle = (): React.CSSProperties => {
		const clipPath = getClipPath();
		const imageOffset = image.imageOffset || { x: 0, y: 0 };
		const imageScale = image.imageScale || 1;

		return {
			clipPath,
			filter: image.grayscale ? "grayscale(1)" : "none",
			transform: `translate(${imageOffset.x}px, ${imageOffset.y}px) scale(${imageScale})`,
			transformOrigin: "top left",
			width: originalDimensions?.width || "auto",
			height: originalDimensions?.height || "auto",
			maxWidth: "none",
			maxHeight: "none",
		};
	};

	// Get clip-path for normal display
	const getClipPath = () => {
		if (!canvasWidth || !canvasHeight) return undefined;

		const imgX = image.position.x;
		const imgY = image.position.y;
		const imgW = image.width;
		const imgH = image.height;

		const clipLeft = Math.max(0, -imgX);
		const clipTop = Math.max(0, -imgY);
		const clipRight = Math.min(imgW, canvasWidth - imgX);
		const clipBottom = Math.min(imgH, canvasHeight - imgY);

		if (clipRight <= clipLeft || clipBottom <= clipTop) {
			return "inset(100% 100% 100% 100%)";
		}

		const leftPercent = (clipLeft / imgW) * 100;
		const topPercent = (clipTop / imgH) * 100;
		const rightPercent = ((imgW - clipRight) / imgW) * 100;
		const bottomPercent = ((imgH - clipBottom) / imgH) * 100;

		if (clipLeft > 0 || clipTop > 0 || clipRight < imgW || clipBottom < imgH) {
			return `inset(${topPercent}% ${rightPercent}% ${bottomPercent}% ${leftPercent}%)`;
		}

		return undefined;
	};

	// Get container style
	const getContainerStyle = (): React.CSSProperties => {
		const positionStyle: React.CSSProperties = {
			left: image.position.x * scale,
			top: image.position.y * scale,
			width: image.width * scale,
			height: image.height * scale,
			transform: `rotate(${image.rotate ?? 0}deg)`,
			transformOrigin: "center center",
		};

		if (image.centerX && canvasWidth) {
			positionStyle.left = ((canvasWidth - image.width) / 2) * scale;
		}

		if (image.centerY && canvasHeight) {
			positionStyle.top = ((canvasHeight - image.height) / 2) * scale;
		}

		return positionStyle;
	};

	// Handle double click to enter crop mode
	const handleDoubleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (originalDimensions) {
			setIsCropMode(true);
		}
	};

	// Handle crop area dragging
	const handleCropMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDraggingCrop(true);
		setDragStartPos({ x: e.clientX, y: e.clientY });
		setInitialCropArea({ ...cropArea });
	};

	// Handle crop area dragging
	useEffect(() => {
		if (!isDraggingCrop || !originalDimensions) return;

		const handleMouseMove = (e: MouseEvent) => {
			const deltaX = (e.clientX - dragStartPos.x) / imageDisplayScale;
			const deltaY = (e.clientY - dragStartPos.y) / imageDisplayScale;

			const newX = Math.max(
				0,
				Math.min(
					originalDimensions.width - initialCropArea.width,
					initialCropArea.x + deltaX,
				),
			);
			const newY = Math.max(
				0,
				Math.min(
					originalDimensions.height - initialCropArea.height,
					initialCropArea.y + deltaY,
				),
			);

			setCropArea({
				...initialCropArea,
				x: newX,
				y: newY,
			});
		};

		const handleMouseUp = () => {
			setIsDraggingCrop(false);
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [
		isDraggingCrop,
		dragStartPos,
		initialCropArea,
		imageDisplayScale,
		originalDimensions,
	]);

	// Apply crop and exit crop mode
	const applyCrop = () => {
		if (!originalDimensions) return;

		// Calculate the new scale to fit the crop area into the container using fill mode
		const scaleX = image.width / cropArea.width;
		const scaleY = image.height / cropArea.height;
		const newScale = Math.max(scaleX, scaleY); // Use max for fill behavior

		// Calculate offset to position the cropped area correctly
		const newOffsetX = -cropArea.x * newScale;
		const newOffsetY = -cropArea.y * newScale;

		// Center the cropped content
		const croppedWidth = cropArea.width * newScale;
		const croppedHeight = cropArea.height * newScale;

		const centerOffsetX = (image.width - croppedWidth) / 2;
		const centerOffsetY = (image.height - croppedHeight) / 2;

		const finalOffsetX = newOffsetX + centerOffsetX;
		const finalOffsetY = newOffsetY + centerOffsetY;

		// Dispatch the crop application event
		document.dispatchEvent(
			new CustomEvent("imageAdjust", {
				detail: {
					id: image.id,
					imageOffset: { x: finalOffsetX, y: finalOffsetY },
					imageScale: newScale,
				},
			}),
		);

		setIsCropMode(false);
	};

	// Cancel crop mode
	const cancelCrop = () => {
		setIsCropMode(false);
	};

	// Reset crop functionality with fill mode
	const resetCrop = () => {
		if (!originalDimensions) return;

		// Reset to default fill behavior
		const containerWidth = image.width;
		const containerHeight = image.height;
		const imageWidth = originalDimensions.width;
		const imageHeight = originalDimensions.height;

		// Calculate what area would be visible with fill scale
		const scaleX = containerWidth / imageWidth;
		const scaleY = containerHeight / imageHeight;
		const fillScale = Math.max(scaleX, scaleY);

		// Calculate the area that would be cropped to fill the container
		const visibleWidth = containerWidth / fillScale;
		const visibleHeight = containerHeight / fillScale;

		// Center the crop area
		const cropX = (imageWidth - visibleWidth) / 2;
		const cropY = (imageHeight - visibleHeight) / 2;

		const fillCropArea = {
			x: Math.max(0, cropX),
			y: Math.max(0, cropY),
			width: Math.min(visibleWidth, imageWidth),
			height: Math.min(visibleHeight, imageHeight),
		};

		setCropArea(fillCropArea);
		setCropAspectRatio(fillCropArea.width / fillCropArea.height);
	};

	// Regular drag functionality
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
					handleImageReplace(ev.target.result as string);
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
		isSnapping,
		image.width,
		image.height,
	]);

	const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
		e.stopPropagation();
		onResizeStart?.(e, image.id, direction, image.width, image.height);
	};

	const handleCropResizeMouseDown = (
		e: React.MouseEvent,
		direction: string,
	) => {
		e.preventDefault();
		e.stopPropagation();
		setIsResizingCrop(true);
		setResizeDirection(direction);
		setDragStartPos({ x: e.clientX, y: e.clientY });
		setInitialCropArea({ ...cropArea });
	};

	useEffect(() => {
		if (!isResizingCrop || !originalDimensions) return;

		const handleMouseMove = (e: MouseEvent) => {
			const deltaX = (e.clientX - dragStartPos.x) / imageDisplayScale;
			const deltaY = (e.clientY - dragStartPos.y) / imageDisplayScale;

			const newCropArea = { ...initialCropArea };

			// Calculate new dimensions based on resize direction
			switch (resizeDirection) {
				case "nw":
					newCropArea.width = Math.max(20, initialCropArea.width - deltaX);
					newCropArea.height = newCropArea.width / cropAspectRatio;
					newCropArea.x =
						initialCropArea.x + initialCropArea.width - newCropArea.width;
					newCropArea.y =
						initialCropArea.y + initialCropArea.height - newCropArea.height;
					break;
				case "ne":
					newCropArea.width = Math.max(20, initialCropArea.width + deltaX);
					newCropArea.height = newCropArea.width / cropAspectRatio;
					newCropArea.x = initialCropArea.x;
					newCropArea.y =
						initialCropArea.y + initialCropArea.height - newCropArea.height;
					break;
				case "sw":
					newCropArea.width = Math.max(20, initialCropArea.width - deltaX);
					newCropArea.height = newCropArea.width / cropAspectRatio;
					newCropArea.x =
						initialCropArea.x + initialCropArea.width - newCropArea.width;
					newCropArea.y = initialCropArea.y;
					break;
				case "se":
					newCropArea.width = Math.max(20, initialCropArea.width + deltaX);
					newCropArea.height = newCropArea.width / cropAspectRatio;
					newCropArea.x = initialCropArea.x;
					newCropArea.y = initialCropArea.y;
					break;
			}

			// Constrain to image boundaries
			newCropArea.x = Math.max(
				0,
				Math.min(originalDimensions.width - newCropArea.width, newCropArea.x),
			);
			newCropArea.y = Math.max(
				0,
				Math.min(originalDimensions.height - newCropArea.height, newCropArea.y),
			);
			newCropArea.width = Math.min(
				originalDimensions.width - newCropArea.x,
				newCropArea.width,
			);
			newCropArea.height = Math.min(
				originalDimensions.height - newCropArea.y,
				newCropArea.height,
			);

			setCropArea(newCropArea);
		};

		const handleMouseUp = () => {
			setIsResizingCrop(false);
			setResizeDirection("");
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [
		isResizingCrop,
		dragStartPos,
		initialCropArea,
		imageDisplayScale,
		originalDimensions,
		resizeDirection,
		cropAspectRatio,
	]);

	const containerStyle = getContainerStyle();

	return (
		<>
			{/* Main image container */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
			<div
				ref={dropZoneRef}
				className={`absolute overflow-hidden ${isActive ? "ring-2 ring-blue-500" : ""} ${
					isDragOver ? "ring-2 ring-green-500" : ""
				}`}
				style={{
					...containerStyle,
					zIndex: layerIndex,
				}}
				onClick={onClick}
				onDoubleClick={handleDoubleClick}
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
						className="pointer-events-none"
						draggable={false}
						style={getImageStyle()}
						onLoad={handleImageLoad}
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
						<div
							className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 border border-white cursor-w-resize"
							onMouseDown={(e) => handleResizeMouseDown(e, "w")}
						/>
						<div
							className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 border border-white cursor-e-resize"
							onMouseDown={(e) => handleResizeMouseDown(e, "e")}
						/>
						<div
							className="absolute left-1/2 -top-1 transform -translate-x-1/2 w-3 h-3 rounded-full bg-blue-500 border border-white cursor-n-resize"
							onMouseDown={(e) => handleResizeMouseDown(e, "n")}
						/>
						<div
							className="absolute left-1/2 -bottom-1 transform -translate-x-1/2 w-3 h-3 rounded-full bg-blue-500 border border-white cursor-s-resize"
							onMouseDown={(e) => handleResizeMouseDown(e, "s")}
						/>
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

			{/* Crop Overlay Modal */}
			{isCropMode && originalDimensions && (
				<>
					{/* Backdrop */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
					<div
						className="fixed inset-0 bg-black bg-opacity-50 z-40"
						onClick={cancelCrop}
					/>

					{/* Crop Modal */}
					<div
						className="fixed z-50 bg-white rounded-lg shadow-2xl border-2 border-gray-300"
						style={{
							left: "50%",
							top: "50%",
							transform: "translate(-50%, -50%)",
							width: Math.min(
								originalDimensions.width * imageDisplayScale + 60,
								window.innerWidth * 0.9,
							),
							height: Math.min(
								originalDimensions.height * imageDisplayScale + 100,
								window.innerHeight * 0.9,
							),
							maxWidth: "90vw",
							maxHeight: "90vh",
						}}
					>
						{/* Header */}
						<div className="flex justify-between items-center p-4 border-b border-gray-200">
							<h3 className="text-gray-800 font-medium text-lg">Adjust Crop</h3>
							<div className="flex gap-2">
								{/* biome-ignore lint/a11y/useButtonType: <explanation> */}
								<button
									onClick={resetCrop}
									className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
								>
									Reset to Fill
								</button>
								{/* biome-ignore lint/a11y/useButtonType: <explanation> */}
								<button
									onClick={cancelCrop}
									className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
								>
									Cancel
								</button>
								{/* biome-ignore lint/a11y/useButtonType: <explanation> */}
								<button
									onClick={applyCrop}
									className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
								>
									Apply
								</button>
							</div>
						</div>

						{/* Image container */}
						<div className="p-4">
							<div
								className="relative mx-auto overflow-hidden bg-gray-100 rounded"
								style={{
									width: Math.min(
										originalDimensions.width * imageDisplayScale,
										window.innerWidth * 0.8,
									),
									height: Math.min(
										originalDimensions.height * imageDisplayScale,
										window.innerHeight * 0.7,
									),
								}}
							>
								{/* Full image */}
								<img
									src={image.src || "https://placecats.com/300/200"}
									alt="Crop preview"
									className="w-full h-full object-contain select-none"
									draggable={false}
								/>

								{/* Crop overlay */}
								<div className="absolute inset-0">
									{/* Dark overlay - 4 rectangles around crop area */}
									<div
										className="absolute bg-black bg-opacity-60"
										style={{
											left: 0,
											top: 0,
											right: 0,
											height: cropArea.y * imageDisplayScale,
										}}
									/>
									<div
										className="absolute bg-black bg-opacity-60"
										style={{
											left: 0,
											top: (cropArea.y + cropArea.height) * imageDisplayScale,
											right: 0,
											bottom: 0,
										}}
									/>
									<div
										className="absolute bg-black bg-opacity-60"
										style={{
											left: 0,
											top: cropArea.y * imageDisplayScale,
											width: cropArea.x * imageDisplayScale,
											height: cropArea.height * imageDisplayScale,
										}}
									/>
									<div
										className="absolute bg-black bg-opacity-60"
										style={{
											left: (cropArea.x + cropArea.width) * imageDisplayScale,
											top: cropArea.y * imageDisplayScale,
											right: 0,
											height: cropArea.height * imageDisplayScale,
										}}
									/>

									{/* Crop area */}
									<div
										className="absolute border-2 border-white cursor-move shadow-lg"
										style={{
											left: cropArea.x * imageDisplayScale,
											top: cropArea.y * imageDisplayScale,
											width: cropArea.width * imageDisplayScale,
											height: cropArea.height * imageDisplayScale,
											backgroundColor: "transparent",
										}}
										onMouseDown={handleCropMouseDown}
									>
										<div
											className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow cursor-nw-resize"
											onMouseDown={(e) => handleCropResizeMouseDown(e, "nw")}
										/>
										<div
											className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow cursor-ne-resize"
											onMouseDown={(e) => handleCropResizeMouseDown(e, "ne")}
										/>
										<div
											className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow cursor-sw-resize"
											onMouseDown={(e) => handleCropResizeMouseDown(e, "sw")}
										/>
										<div
											className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow cursor-se-resize"
											onMouseDown={(e) => handleCropResizeMouseDown(e, "se")}
										/>

										{/* Grid lines */}
										<div className="absolute inset-0 pointer-events-none">
											<div className="absolute left-1/3 top-0 bottom-0 w-px bg-white opacity-70" />
											<div className="absolute left-2/3 top-0 bottom-0 w-px bg-white opacity-70" />
											<div className="absolute top-1/3 left-0 right-0 h-px bg-white opacity-70" />
											<div className="absolute top-2/3 left-0 right-0 h-px bg-white opacity-70" />
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className="px-4 pb-4 text-center text-gray-600 text-sm">
							Drag to move • Drag corners to resize (maintains aspect ratio) •
							Target size: {image.width} × {image.height} px
						</div>
					</div>
				</>
			)}
		</>
	);
}
