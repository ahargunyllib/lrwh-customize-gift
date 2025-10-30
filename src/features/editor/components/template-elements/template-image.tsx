import type { CropArea, ImageElement } from "@/shared/types/template";
import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import { CropModal } from "./crop-modal";

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
		const scaleX = image.scaleX || 1;
		const scaleY = image.scaleY || 1;

		// Calculate what part of the original image is currently visible
		const visibleX = Math.max(0, -imageOffset.x / scaleX);
		const visibleY = Math.max(0, -imageOffset.y / scaleY);

		const maxVisibleWidth = originalDimensions.width - visibleX;
		const maxVisibleHeight = originalDimensions.height - visibleY;
		const containerWidthInOriginal = image.width / scaleX;
		const containerHeightInOriginal = image.height / scaleY;

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
		image.scaleX,
		image.scaleY,
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
			const displayScale = Math.min(scaleX, scaleY, 0.8);

			setImageDisplayScale(displayScale);
		}
	}, [isCropMode, originalDimensions, calculateCurrentCropArea]);

	// Load original image dimensions
	const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
		const img = e.currentTarget;
		const naturalWidth = img.naturalWidth;
		const naturalHeight = img.naturalHeight;

		setOriginalDimensions({
			width: naturalWidth,
			height: naturalHeight,
		});

		// Set offset to fill the container (background-size: cover behavior)
		if (image.imageOffset) {
			const containerAspectRatio = image.width / image.height;
			const imageAspectRatio = naturalWidth / naturalHeight;

			let fillScaleX: number;
			let fillScaleY: number;
			let fillOffsetX: number;
			let fillOffsetY: number;

			if (containerAspectRatio > imageAspectRatio) {
				// Container is wider - scale to fill width, crop height
				fillScaleX = image.width / naturalWidth;
				fillScaleY = fillScaleX;
				const scaledHeight = naturalHeight * fillScaleY;
				fillOffsetX = 0;
				fillOffsetY = -(scaledHeight - image.height) / 2;
			} else {
				// Container is taller - scale to fill height, crop width
				fillScaleY = image.height / naturalHeight;
				fillScaleX = fillScaleY;
				const scaledWidth = naturalWidth * fillScaleX;
				fillOffsetX = -(scaledWidth - image.width) / 2;
				fillOffsetY = 0;
			}

			document.dispatchEvent(
				new CustomEvent("imageAdjust", {
					detail: {
						id: image.id,
						imageOffset: { x: fillOffsetX, y: fillOffsetY },
						scaleX: fillScaleX,
						scaleY: fillScaleY,
					},
				}),
			);
			return;
		}

		// Initialize image settings if not set
		if (!image.imageOffset || (!image.scaleX && !image.scaleY)) {
			// Calculate scale to fill the container (like background-size: cover)
			const containerAspectRatio = image.width / image.height;
			const imageAspectRatio = naturalWidth / naturalHeight;

			let initialScaleX: number;
			let initialScaleY: number;
			let offsetX: number;
			let offsetY: number;

			if (containerAspectRatio > imageAspectRatio) {
				// Container is wider than image - scale to fit width
				initialScaleX = image.width / naturalWidth;
				initialScaleY = initialScaleX;
				const scaledHeight = naturalHeight * initialScaleY;
				offsetX = 0;
				offsetY = (image.height - scaledHeight) / 2;
			} else {
				// Container is taller than image - scale to fit height
				initialScaleY = image.height / naturalHeight;
				initialScaleX = initialScaleY;
				const scaledWidth = naturalWidth * initialScaleX;
				offsetX = (image.width - scaledWidth) / 2;
				offsetY = 0;
			}

			// Dispatch initial settings
			document.dispatchEvent(
				new CustomEvent("imageAdjust", {
					detail: {
						id: image.id,
						imageOffset: { x: offsetX, y: offsetY },
						scaleX: initialScaleX,
						scaleY: initialScaleY,
					},
				}),
			);
		}
	};

	const getImageStyle = (): React.CSSProperties => {
		const clipPath = getClipPath();
		const imageOffset = image.imageOffset || { x: 0, y: 0 };
		const scaleX = (image.scaleX || 1) * scale;
		const scaleY = (image.scaleY || 1) * scale;

		return {
			clipPath,
			filter: image.grayscalePercent
				? `grayscale(${image.grayscalePercent}%)`
				: "none",
			transform: `translate(${imageOffset.x * scale}px, ${imageOffset.y * scale}px) scale(${scaleX}, ${scaleY})`,
			transformOrigin: "0 0",
			width: originalDimensions?.width || "auto",
			height: originalDimensions?.height || "auto",
			maxWidth: "none",
			maxHeight: "none",
			transition: "var(--transition-editor)",
		};
	};
	// Get clip-path for normal display
	const getClipPath = () => {
		if (!canvasWidth || !canvasHeight) return undefined;

		const imgX = image.position.x * scale;
		const imgY = image.position.y * scale;
		const imgW = image.width * scale;
		const imgH = image.height * scale;

		const clipLeft = Math.max(0, -imgX);
		const clipTop = Math.max(0, -imgY);
		const clipRight = Math.min(imgW, canvasWidth * scale - imgX);
		const clipBottom = Math.min(imgH, canvasHeight * scale - imgY);

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

	// Handle crop area touch dragging
	const handleCropTouchStart = (e: React.TouchEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const touch = e.touches[0];
		setIsDraggingCrop(true);
		setDragStartPos({ x: touch.clientX, y: touch.clientY });
		setInitialCropArea({ ...cropArea });
	};

	// Handle crop resize touch
	const handleCropResizeTouchStart = (
		e: React.TouchEvent,
		direction: string,
	) => {
		e.preventDefault();
		e.stopPropagation();
		const touch = e.touches[0];
		setIsResizingCrop(true);
		setResizeDirection(direction);
		setDragStartPos({ x: touch.clientX, y: touch.clientY });
		setInitialCropArea({ ...cropArea });
	};

	// Add touch event handlers for crop dragging
	useEffect(() => {
		if (!isDraggingCrop || !originalDimensions) return;

		const handleTouchMove = (e: TouchEvent) => {
			e.preventDefault();
			const touch = e.touches[0];
			const deltaX = (touch.clientX - dragStartPos.x) / imageDisplayScale;
			const deltaY = (touch.clientY - dragStartPos.y) / imageDisplayScale;

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

		const handleTouchEnd = () => {
			setIsDraggingCrop(false);
		};

		document.addEventListener("touchmove", handleTouchMove, { passive: false });
		document.addEventListener("touchend", handleTouchEnd);

		return () => {
			document.removeEventListener("touchmove", handleTouchMove);
			document.removeEventListener("touchend", handleTouchEnd);
		};
	}, [
		isDraggingCrop,
		dragStartPos,
		initialCropArea,
		imageDisplayScale,
		originalDimensions,
	]);

	// Add touch event handlers for crop resizing
	useEffect(() => {
		if (!isResizingCrop || !originalDimensions) return;

		const handleTouchMove = (e: TouchEvent) => {
			e.preventDefault();
			const touch = e.touches[0];
			const deltaX = (touch.clientX - dragStartPos.x) / imageDisplayScale;
			const deltaY = (touch.clientY - dragStartPos.y) / imageDisplayScale;

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

		const handleTouchEnd = () => {
			setIsResizingCrop(false);
			setResizeDirection("");
		};

		document.addEventListener("touchmove", handleTouchMove, { passive: false });
		document.addEventListener("touchend", handleTouchEnd);

		return () => {
			document.removeEventListener("touchmove", handleTouchMove);
			document.removeEventListener("touchend", handleTouchEnd);
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

	// Apply crop and exit crop mode
	const applyCrop = () => {
		if (!originalDimensions) return;

		// Calculate the new scale to fit the crop area into the container
		const scaleX = image.width / cropArea.width;
		const scaleY = image.height / cropArea.height;
		const newScale = Math.min(scaleX, scaleY);

		// Calculate offset to position the cropped area correctly
		// We want to move the image so that the crop area's top-left becomes (0,0)
		const newOffsetX = -cropArea.x * newScale;
		const newOffsetY = -cropArea.y * newScale;

		// Center the cropped content if it's smaller than the container
		const croppedWidth = cropArea.width * newScale;
		const croppedHeight = cropArea.height * newScale;

		const centerOffsetX =
			croppedWidth < image.width ? (image.width - croppedWidth) / 2 : 0;
		const centerOffsetY =
			croppedHeight < image.height ? (image.height - croppedHeight) / 2 : 0;

		const finalOffsetX = newOffsetX + centerOffsetX;
		const finalOffsetY = newOffsetY + centerOffsetY;

		// Dispatch the crop application event
		document.dispatchEvent(
			new CustomEvent("imageAdjust", {
				detail: {
					id: image.id,
					imageOffset: { x: finalOffsetX, y: finalOffsetY },
					scaleX: newScale,
					scaleY: newScale,
				},
			}),
		);

		setIsCropMode(false);
	};

	// Cancel crop mode
	const cancelCrop = () => {
		setIsCropMode(false);
	};

	// Reset crop functionality
	const resetCrop = () => {
		if (!originalDimensions) return;

		// Reset crop area to cover entire image
		const fullCropArea = {
			x: 0,
			y: 0,
			width: originalDimensions.width,
			height: originalDimensions.height,
		};

		setCropArea(fullCropArea);
		setCropAspectRatio(originalDimensions.width / originalDimensions.height);
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
				className={`absolute overflow-hidden ${
					isActive ? "ring-2 ring-editor-selection shadow-editor-element" : ""
				} ${isDragOver ? "ring-2 ring-primary" : ""}`}
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
						src={
							image.src ||
							"https://images.unsplash.com/photo-1501594907352-04cda38ebc29"
						}
						alt="Template element"
						className="pointer-events-none select-none"
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
							className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full bg-editor-handle border-2 border-editor-handle-border cursor-w-resize shadow-sm"
							onMouseDown={(e) =>
								onResizeStart?.(e, image.id, "w", image.width, image.height)
							}
						/>
						<div
							className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full bg-editor-handle border-2 border-editor-handle-border cursor-e-resize shadow-sm"
							onMouseDown={(e) =>
								onResizeStart?.(e, image.id, "e", image.width, image.height)
							}
						/>
						<div
							className="absolute left-1/2 -top-1 transform -translate-x-1/2 w-3 h-3 rounded-full bg-editor-handle border-2 border-editor-handle-border cursor-n-resize shadow-sm"
							onMouseDown={(e) =>
								onResizeStart?.(e, image.id, "n", image.width, image.height)
							}
						/>
						<div
							className="absolute left-1/2 -bottom-1 transform -translate-x-1/2 w-3 h-3 rounded-full bg-editor-handle border-2 border-editor-handle-border cursor-s-resize shadow-sm"
							onMouseDown={(e) =>
								onResizeStart?.(e, image.id, "s", image.width, image.height)
							}
						/>
						<div
							className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-editor-handle border-2 border-editor-handle-border cursor-nw-resize shadow-sm"
							onMouseDown={(e) =>
								onResizeStart?.(e, image.id, "nw", image.width, image.height)
							}
						/>
						<div
							className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-editor-handle border-2 border-editor-handle-border cursor-ne-resize shadow-sm"
							onMouseDown={(e) =>
								onResizeStart?.(e, image.id, "ne", image.width, image.height)
							}
						/>
						<div
							className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-editor-handle border-2 border-editor-handle-border cursor-sw-resize shadow-sm"
							onMouseDown={(e) =>
								onResizeStart?.(e, image.id, "sw", image.width, image.height)
							}
						/>
						<div
							className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-editor-handle border-2 border-editor-handle-border cursor-se-resize shadow-sm"
							onMouseDown={(e) =>
								onResizeStart?.(e, image.id, "se", image.width, image.height)
							}
						/>
					</>
				)}
			</div>

			{/* Crop Overlay Modal */}
			{isCropMode && originalDimensions && (
				<CropModal
					isOpen={isCropMode}
					onClose={cancelCrop}
					image={image}
					originalDimensions={originalDimensions}
					cropArea={cropArea}
					setCropArea={setCropArea}
					applyCrop={applyCrop}
					onCropMouseDown={handleCropMouseDown}
					onCropResizeMouseDown={handleCropResizeMouseDown}
					onCropTouchStart={handleCropTouchStart}
					onCropResizeTouchStart={handleCropResizeTouchStart}
				/>
			)}
		</>
	);
}
