"use client";

import type { TemplateData, TextElement } from "@/shared/types/template";
import { useEffect, useRef, useState } from "react";
import type React from "react";

interface TemplateTextProps {
	text: TextElement;
	isActive: boolean;
	isEditing: boolean;
	onClick: (e: React.MouseEvent) => void;
	onDoubleClick: () => void;
	onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	onInputBlur: () => void;
	onInputKeyDown: (e: React.KeyboardEvent) => void;
	scale?: number;
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
	onResizeStart?: (
		e: React.MouseEvent,
		textId: string,
		direction: string,
		width: number,
		height: number,
		posX: number,
		posY: number,
	) => void;
	setTemplate: React.Dispatch<React.SetStateAction<TemplateData>>;
	layerIndex: number;
}

export default function TemplateText({
	text,
	isActive,
	isEditing,
	onClick,
	onDoubleClick,
	onInputChange,
	onInputBlur,
	onInputKeyDown,
	scale = 1,
	getSnapPosition,
	constrainToCanvas,
	isSnapping = false,
	canvasWidth = 0,
	canvasHeight = 0,
	onResizeStart,
	setTemplate,
	layerIndex,
}: TemplateTextProps) {
	const {
		backgroundColor,
		borderRadius,
		padding = 0,
		letterSpacing,
		curved = false,
		curveRadius = 0, // Now -100 to 100
		curveDirection = "up",
		curveIntensity = 1,
		textStroke,
		WebkitTextStroke,
	} = text.style;

	const textRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const hiddenTextareaRef = useRef<HTMLTextAreaElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

	const fontSizeNum =
		typeof text.style.fontSize === "string"
			? Number.parseFloat(text.style.fontSize)
			: text.style.fontSize;

	const calculateCharTransform = (
		index: number,
		totalChars: number,
		curvature: number, // -100 to 100
		direction: "up" | "down" = "up",
	) => {
		if (curvature === 0) {
			return { x: 0, y: 0, rotation: 0 };
		}

		// Convert -100 to 100 range to radius
		// Negative values = curve down, positive = curve up
		const absValue = Math.abs(curvature);
		const effectiveDirection = curvature < 0 ? "down" : "up";

		// Map curve value to radius (100 = tight curve, 0 = no curve)
		// Using exponential mapping for better control
		const baseRadius = 500; // Maximum radius for subtle curve
		const minRadius = 100; // Minimum radius for maximum curve
		const t = absValue / 100; // 0 to 1
		const radius = baseRadius - (baseRadius - minRadius) * t ** 0.7;

		const textLength = totalChars * fontSizeNum * 0.6;
		const circumference = 2 * Math.PI * radius;
		const angleSpan = (textLength / circumference) * 2 * Math.PI;
		const anglePerChar = angleSpan / totalChars;
		const startAngle = -angleSpan / 2;
		const angle = startAngle + anglePerChar * index + anglePerChar / 2;

		const directionMultiplier = effectiveDirection === "up" ? 1 : -1;
		const x = Math.sin(angle) * radius;
		const y = (1 - Math.cos(angle)) * radius * directionMultiplier;
		const rotation = ((angle * 180) / Math.PI) * directionMultiplier;

		return { x, y, rotation };
	};

	// Calculate the actual width and height needed for curved text
	const getCurvedTextDimensions = () => {
		if (!curved || !text.content.trim() || curveRadius === 0) {
			return {
				width: text.width || 200,
				height: text.height || 100,
			};
		}

		const chars = text.content.split("");
		const absValue = Math.abs(curveRadius);

		// Map curve value to radius
		const baseRadius = 500;
		const minRadius = 100;
		const t = absValue / 100;
		const radius = baseRadius - (baseRadius - minRadius) * t ** 0.7;

		const textLength = chars.length * fontSizeNum * 0.6;
		const circumference = 2 * Math.PI * radius;
		const angleSpan = (textLength / circumference) * 2 * Math.PI;

		// Calculate the horizontal span of the curve
		const horizontalSpan = Math.sin(angleSpan / 2) * radius * 2;

		// Calculate vertical height (how much the curve extends up/down)
		const verticalExtent = radius * (1 - Math.cos(angleSpan / 2));

		// Add padding for character dimensions
		const estimatedWidth = Math.max(
			horizontalSpan + fontSizeNum * 2,
			text.width || 200,
		);

		const estimatedHeight = Math.max(
			verticalExtent + fontSizeNum * 3,
			fontSizeNum * 2.5,
		);

		return {
			width: estimatedWidth,
			height: estimatedHeight,
		};
	};

	// Get clip-path to crop the parts outside canvas
	const getClipPath = () => {
		if (!canvasWidth || !canvasHeight) return undefined;

		const dimensions = getCurvedTextDimensions();
		const textX = text.position.x || 0;
		const textY = text.position.y || 0;
		const textW = dimensions.width;
		const textH = dimensions.height;

		// Calculate the visible rectangle relative to the text element
		const clipLeft = Math.max(0, -textX);
		const clipTop = Math.max(0, -textY);
		const clipRight = Math.min(textW, canvasWidth - textX);
		const clipBottom = Math.min(textH, canvasHeight - textY);

		// If text is completely outside canvas
		if (clipRight <= clipLeft || clipBottom <= clipTop) {
			return "inset(100% 100% 100% 100%)";
		}

		// Convert to percentages for clip-path
		const leftPercent = Math.max(0, (clipLeft / textW) * 100);
		const topPercent = Math.max(0, (clipTop / textH) * 100);
		const rightPercent = Math.max(0, ((textW - clipRight) / textW) * 100);
		const bottomPercent = Math.max(0, ((textH - clipBottom) / textH) * 100);

		// Only apply clip-path if there's actual cropping needed
		if (
			clipLeft > 0 ||
			clipTop > 0 ||
			clipRight < textW ||
			clipBottom < textH
		) {
			return `inset(${topPercent}% ${rightPercent}% ${bottomPercent}% ${leftPercent}%)`;
		}

		return undefined;
	};

	const updateHeightFromTextarea = (content: string) => {
		if (hiddenTextareaRef.current && !curved) {
			const hiddenTextarea = hiddenTextareaRef.current;
			hiddenTextarea.value = content;
			hiddenTextarea.style.height = "auto";
			const newHeight = hiddenTextarea.scrollHeight;

			const minHeight = Math.max(
				newHeight + (Number(padding) || 0) * 2,
				fontSizeNum * 2,
			);

			setTemplate((prev) => ({
				...prev,
				texts: prev.texts.map((t) =>
					t.id === text.id ? { ...t, height: minHeight } : t,
				),
			}));
		} else if (curved) {
			// For curved text, calculate appropriate dimensions
			const dimensions = getCurvedTextDimensions();

			setTemplate((prev) => ({
				...prev,
				texts: prev.texts.map((t) =>
					t.id === text.id
						? {
								...t,
								height: dimensions.height,
								width: dimensions.width,
							}
						: t,
				),
			}));
		}
	};

	// Update height when content changes (hanya saat tidak sedang resize)
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		// Cek apakah sedang dalam proses resize
		const isResizing = document.querySelector(`[data-resizing="${text.id}"]`);
		if (!isResizing) {
			updateHeightFromTextarea(text.content);
		}
	}, [
		text.content,
		text.width,
		fontSizeNum,
		text.style.lineHeight,
		text.style.fontFamily,
		curved,
		curveRadius,
		curveIntensity,
	]);

	// Auto-resize textarea height when editing
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (isEditing && textareaRef.current && !curved) {
			const textarea = textareaRef.current;
			textarea.style.height = "auto";
			const newHeight = textarea.scrollHeight;

			const totalHeight = newHeight + (Number(padding) || 0) * 2;
			textarea.style.height = `${totalHeight}px`;

			// Update template height to match textarea
			setTemplate((prev) => ({
				...prev,
				texts: prev.texts.map((t) =>
					t.id === text.id ? { ...t, height: totalHeight } : t,
				),
			}));
		}
	}, [text.content, isEditing, text.id, setTemplate, curved, padding]);

	const getContainerStyle = (): React.CSSProperties => {
		const dimensions = getCurvedTextDimensions();

		return {
			position: "absolute",
			left: (text.position.x || 0) * scale,
			top: (text.position.y || 0) * scale,
			width: dimensions.width * scale,
			height: dimensions.height * scale,
			transform: `rotate(${text.rotate}deg)`,
			transformOrigin: "center center",
			backgroundColor: backgroundColor || "transparent",
			borderRadius: (borderRadius || 0) * scale,
			border: isActive
				? `${2 * scale}px solid #3b82f6`
				: `${2 * scale}px solid transparent`,
			cursor: text.draggable && !isEditing ? "move" : "default",
			boxSizing: "border-box",
			clipPath: getClipPath(),
			overflow: "visible",
			zIndex: layerIndex,
			padding: 0,
			display: "flex",
			alignItems: "flex-start",
			justifyContent: "flex-start",
		};
	};

	const getTextStyle = (): React.CSSProperties => ({
		width: "100%",
		height: "100%",
		fontFamily: text.style.fontFamily,
		fontSize: fontSizeNum * scale,
		fontWeight: text.style.fontWeight,
		color: text.style.color,
		lineHeight: text.style.lineHeight || "1.4",
		textAlign: (text.style.textAlign ||
			"left") as React.CSSProperties["textAlign"],
		padding: 0,
		margin: 0,
		border: "none",
		outline: "none",
		background: "transparent",
		resize: "none",
		overflow: "hidden",
		wordWrap: "break-word",
		whiteSpace: "pre-wrap",
		letterSpacing:
			(letterSpacing || "normal") === "normal"
				? "normal"
				: `${Number.parseFloat(String(letterSpacing || "0")) * scale}px`,
		boxSizing: "border-box",
		textStroke: textStroke || WebkitTextStroke || undefined,
		WebkitTextStroke: (WebkitTextStroke || textStroke) as string,
		zIndex: layerIndex,
		display: "block",
	});

	const getDisplayStyle = (): React.CSSProperties => ({
		width: "100%",
		height: "100%",
		fontFamily: text.style.fontFamily,
		fontSize: fontSizeNum * scale,
		fontWeight: text.style.fontWeight,
		color: text.style.color,
		lineHeight: text.style.lineHeight || "1.4",
		textAlign: (text.style.textAlign ||
			"left") as React.CSSProperties["textAlign"],
		padding: 0,
		margin: 0,
		border: "none",
		outline: "none",
		background: "transparent",
		wordWrap: "break-word",
		whiteSpace: curved ? "nowrap" : "pre-wrap",
		letterSpacing:
			(letterSpacing || "normal") === "normal"
				? "normal"
				: `${Number.parseFloat(String(letterSpacing || "0")) * scale}px`,
		boxSizing: "border-box",
		overflow: "hidden",
		textStroke: textStroke || WebkitTextStroke || undefined,
		WebkitTextStroke: (WebkitTextStroke || textStroke) as string,
		zIndex: layerIndex,
	});

	const handleMouseDown = (e: React.MouseEvent) => {
		if (text.draggable && !isEditing) {
			e.preventDefault();
			e.stopPropagation();

			const canvas = document.querySelector('[data-canvas="true"]');
			if (canvas) {
				const canvasRect = canvas.getBoundingClientRect();
				const mouseX = (e.clientX - canvasRect.left) / scale;
				const mouseY = (e.clientY - canvasRect.top) / scale;

				setDragOffset({
					x: mouseX - text.position.x,
					y: mouseY - text.position.y,
				});
				setIsDragging(true);
			}
		}
	};

	const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
		if (onResizeStart) {
			// Tambahkan marker untuk menandai sedang resize
			e.currentTarget.setAttribute("data-resizing", text.id);
			const dimensions = getCurvedTextDimensions();
			onResizeStart(
				e,
				text.id,
				direction,
				dimensions.width,
				dimensions.height,
				text.position.x || 0,
				text.position.y || 0,
			);
		}
	};

	// Custom input change handler that preserves fontSize and updates height
	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newContent = e.target.value;

		// Update content while preserving all other properties
		setTemplate((prev) => ({
			...prev,
			texts: prev.texts.map((t) =>
				t.id === text.id
					? {
							...t,
							content: newContent,
							style: {
								...t.style,
								fontSize: t.style.fontSize, // Preserve fontSize
							},
						}
					: t,
			),
		}));

		// Call parent's onInputChange
		onInputChange(e);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (!isDragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			if (isDragging) {
				const canvas = document.querySelector('[data-canvas="true"]');
				if (canvas) {
					const canvasRect = canvas.getBoundingClientRect();
					const mouseX = (e.clientX - canvasRect.left) / scale;
					const mouseY = (e.clientY - canvasRect.top) / scale;

					const newX = mouseX - dragOffset.x;
					const newY = mouseY - dragOffset.y;

					let newPosition = { x: newX, y: newY };

					const isMovingSlowly =
						e.movementX * e.movementX + e.movementY * e.movementY < 25;

					const dimensions = getCurvedTextDimensions();
					if (getSnapPosition && isSnapping && isMovingSlowly) {
						newPosition = getSnapPosition(
							newPosition,
							dimensions.width,
							dimensions.height,
						);
					}

					// Don't use constrainToCanvas since we want to allow partial visibility
					// The cropping will handle the visual clipping
					document.dispatchEvent(
						new CustomEvent("elementMove", {
							detail: {
								id: text.id,
								type: "text",
								position: newPosition,
							},
						}),
					);
				}
			}
		};

		const handleMouseUp = () => {
			setIsDragging(false);
			// Remove resize marker
			const resizeMarker = document.querySelector(
				`[data-resizing="${text.id}"]`,
			);
			if (resizeMarker) {
				resizeMarker.removeAttribute("data-resizing");
			}
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [
		isDragging,
		dragOffset,
		text.id,
		text.width,
		text.height,
		text.position.x,
		text.position.y,
		scale,
		getSnapPosition,
		isSnapping,
	]);

	// Render curved text using CSS transforms
	const renderCurvedText = () => {
		if (!curved || !text.content.trim() || curveRadius === 0) return null;

		const chars = text.content.split("");
		const dimensions = getCurvedTextDimensions();
		const centerX = dimensions.width / 2;
		const centerY = dimensions.height / 2;

		return (
			<div
				style={{
					position: "relative",
					width: "100%",
					height: "100%",
				}}
			>
				{chars.map((char, index) => {
					const { x, y, rotation } = calculateCharTransform(
						index,
						chars.length,
						curveRadius,
						curveDirection,
					);

					return (
						<span
							key={`${text.id}-char-${index}`}
							style={{
								padding: 0,
								position: "absolute",
								left: `${centerX * scale}px`,
								top: `${centerY * scale}px`,
								transform: `translate(${x * scale}px, ${y * scale}px) rotate(${rotation}deg) translate(-50%, -50%)`,
								transformOrigin: "center center",
								fontFamily: text.style.fontFamily,
								fontSize: fontSizeNum * scale,
								fontWeight: text.style.fontWeight,
								color: text.style.color,
								letterSpacing:
									(letterSpacing || "normal") === "normal"
										? "normal"
										: `${Number.parseFloat(String(letterSpacing || "0")) * scale}px`,
								textStroke: textStroke || WebkitTextStroke || undefined,
								WebkitTextStroke: (WebkitTextStroke || textStroke) as string,
								whiteSpace: "nowrap",
								display: "inline-block",
								zIndex: layerIndex,
							}}
						>
							{char}
						</span>
					);
				})}
			</div>
		);
	};

	// Scale resize handle size based on scale
	const handleSize = Math.max(12 * scale, 8); // Minimum 8px, scales with zoom
	const handleBorder = Math.max(1 * scale, 1); // Minimum 1px border

	return (
		<>
			{/* Hidden textarea for height calculation */}
			<textarea
				ref={hiddenTextareaRef}
				style={{
					...getTextStyle(),
					position: "absolute",
					top: "-9999px",
					left: "-9999px",
					visibility: "hidden",
					pointerEvents: "none",
					width: (text.width || 200) * scale,
				}}
				readOnly
			/>

			{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
			<div
				ref={textRef}
				style={getContainerStyle()}
				onClick={(e) => {
					e.stopPropagation();
					onClick(e);
				}}
				onDoubleClick={(e) => {
					e.stopPropagation();
					onDoubleClick();
				}}
				onMouseDown={handleMouseDown}
			>
				{isEditing ? (
					<textarea
						ref={textareaRef}
						value={text.content}
						onChange={handleInputChange}
						onBlur={onInputBlur}
						onKeyDown={onInputKeyDown}
						onDoubleClick={(e) => e.stopPropagation()}
						style={{
							...getTextStyle(),
							zIndex: layerIndex,
							display: "block",
						}}
					/>
				) : (
					<>
						{curved && curveRadius !== 0 ? (
							renderCurvedText()
						) : (
							<div style={getDisplayStyle()}>{text.content}</div>
						)}
					</>
				)}

				{/* Resize Handles - Properly scaled */}
				{isActive && !isEditing && (
					<>
						{/* Horizontal edges */}
						<div
							className="absolute bg-blue-500 border border-white rounded-full"
							style={{
								left: `-${handleSize / 2}px`,
								top: "50%",
								transform: "translateY(-50%)",
								width: `${handleSize}px`,
								height: `${handleSize}px`,
								borderWidth: `${handleBorder}px`,
								cursor: "w-resize",
							}}
							onMouseDown={(e) => handleResizeMouseDown(e, "w")}
						/>
						<div
							className="absolute bg-blue-500 border border-white rounded-full"
							style={{
								right: `-${handleSize / 2}px`,
								top: "50%",
								transform: "translateY(-50%)",
								width: `${handleSize}px`,
								height: `${handleSize}px`,
								borderWidth: `${handleBorder}px`,
								cursor: "e-resize",
							}}
							onMouseDown={(e) => handleResizeMouseDown(e, "e")}
						/>

						{/* Vertical edges */}
						<div
							className="absolute bg-blue-500 border border-white rounded-full"
							style={{
								left: "50%",
								top: `-${handleSize / 2}px`,
								transform: "translateX(-50%)",
								width: `${handleSize}px`,
								height: `${handleSize}px`,
								borderWidth: `${handleBorder}px`,
								cursor: "n-resize",
							}}
							onMouseDown={(e) => handleResizeMouseDown(e, "n")}
						/>
						<div
							className="absolute bg-blue-500 border border-white rounded-full"
							style={{
								left: "50%",
								bottom: `-${handleSize / 2}px`,
								transform: "translateX(-50%)",
								width: `${handleSize}px`,
								height: `${handleSize}px`,
								borderWidth: `${handleBorder}px`,
								cursor: "s-resize",
							}}
							onMouseDown={(e) => handleResizeMouseDown(e, "s")}
						/>

						{/* Corners */}
						<div
							className="absolute bg-blue-500 border border-white rounded-full"
							style={{
								left: `-${handleSize / 2}px`,
								top: `-${handleSize / 2}px`,
								width: `${handleSize}px`,
								height: `${handleSize}px`,
								borderWidth: `${handleBorder}px`,
								cursor: "nw-resize",
							}}
							onMouseDown={(e) => handleResizeMouseDown(e, "nw")}
						/>
						<div
							className="absolute bg-blue-500 border border-white rounded-full"
							style={{
								right: `-${handleSize / 2}px`,
								top: `-${handleSize / 2}px`,
								width: `${handleSize}px`,
								height: `${handleSize}px`,
								borderWidth: `${handleBorder}px`,
								cursor: "ne-resize",
							}}
							onMouseDown={(e) => handleResizeMouseDown(e, "ne")}
						/>
						<div
							className="absolute bg-blue-500 border border-white rounded-full"
							style={{
								left: `-${handleSize / 2}px`,
								bottom: `-${handleSize / 2}px`,
								width: `${handleSize}px`,
								height: `${handleSize}px`,
								borderWidth: `${handleBorder}px`,
								cursor: "sw-resize",
							}}
							onMouseDown={(e) => handleResizeMouseDown(e, "sw")}
						/>
						<div
							className="absolute bg-blue-500 border border-white rounded-full"
							style={{
								right: `-${handleSize / 2}px`,
								bottom: `-${handleSize / 2}px`,
								width: `${handleSize}px`,
								height: `${handleSize}px`,
								borderWidth: `${handleBorder}px`,
								cursor: "se-resize",
							}}
							onMouseDown={(e) => handleResizeMouseDown(e, "se")}
						/>
					</>
				)}
			</div>
		</>
	);
}
