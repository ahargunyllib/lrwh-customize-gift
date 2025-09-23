import type { CropArea, ImageElement } from "@/shared/types/template";
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

	// Get current image style for display
	const getImageStyle = (): React.CSSProperties => {
		const clipPath = getClipPath();
		const imageOffset = image.imageOffset || { x: 0, y: 0 };
		const scaleX = image.scaleX || 1;
		const scaleY = image.scaleY || 1;

		return {
			clipPath,
			filter: image.grayscale ? "grayscale(1)" : "none",
			transform: `translate(${imageOffset.x}px, ${imageOffset.y}px) scale(${scaleX}, ${scaleY})`,
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
				<>
					{/* Backdrop */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
					<div
						className="fixed inset-0 bg-black bg-opacity-50 z-40"
						onClick={() => setIsCropMode(false)}
					/>

					{/* Crop Modal */}
					<div
						className="fixed z-50 bg-white rounded-lg shadow-editor-modal border-2 border-border"
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
						<div className="flex justify-between items-center p-4 border-b border-border">
							<h3 className="text-foreground font-medium text-lg">
								Adjust Crop
							</h3>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => setIsCropMode(false)}
									className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={applyCrop}
									className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
								>
									Apply
								</button>
							</div>
						</div>

						{/* Image container with crop overlay */}
						<div className="p-4">
							<div
								className="relative mx-auto overflow-hidden bg-editor-canvas rounded"
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
								<img
									src={
										image.src ||
										"https://images.unsplash.com/photo-1501594907352-04cda38ebc29"
									}
									alt="Crop preview"
									className="w-full h-full object-contain select-none"
									draggable={false}
								/>

								{/* Crop overlay with dark areas */}
								<div className="absolute inset-0">
									{/* Dark overlays */}
									<div
										className="absolute bg-editor-crop-overlay bg-opacity-60"
										style={{
											left: 0,
											top: 0,
											right: 0,
											height: cropArea.y * imageDisplayScale,
										}}
									/>
									<div
										className="absolute bg-editor-crop-overlay bg-opacity-60"
										style={{
											left: 0,
											top: (cropArea.y + cropArea.height) * imageDisplayScale,
											right: 0,
											bottom: 0,
										}}
									/>
									<div
										className="absolute bg-editor-crop-overlay bg-opacity-60"
										style={{
											left: 0,
											top: cropArea.y * imageDisplayScale,
											width: cropArea.x * imageDisplayScale,
											height: cropArea.height * imageDisplayScale,
										}}
									/>
									<div
										className="absolute bg-editor-crop-overlay bg-opacity-60"
										style={{
											left: (cropArea.x + cropArea.width) * imageDisplayScale,
											top: cropArea.y * imageDisplayScale,
											right: 0,
											height: cropArea.height * imageDisplayScale,
										}}
									/>

									{/* Crop selection area */}
									<div
										className="absolute border-2 border-editor-crop-area cursor-move"
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

						<div className="px-4 pb-4 text-center text-muted-foreground text-sm">
							Double-click image to crop • Target size: {image.width} ×{" "}
							{image.height}px
						</div>
					</div>
				</>
			)}
		</>
	);
}
