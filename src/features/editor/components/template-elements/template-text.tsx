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
		curveRadius = 200,
		curveDirection = "up",
		curveIntensity = 1,
		textStroke,
		WebkitTextStroke,
	} = text.style;

	const textRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const hiddenTextareaRef = useRef<HTMLTextAreaElement>(null);
	const svgRef = useRef<SVGSVGElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

	const fontSizeNum =
		typeof text.style.fontSize === "string"
			? Number.parseFloat(text.style.fontSize)
			: text.style.fontSize;

	const createCurvedTextPath = (
		textContent: string,
		radius: number,
		direction: "up" | "down" = "up",
	) => {
		const textLength = textContent.length;
		const circumference = 2 * Math.PI * radius;
		const anglePerChar =
			(((textLength * fontSizeNum * 0.6) / circumference) * 2 * Math.PI) /
			textLength;

		let path = "";
		const centerX = (text.width || 200) / 2;
		const centerY = (text.height || 100) / 2;

		// Adjust radius based on intensity but keep consistent baseline
		const adjustedRadius = radius * curveIntensity;

		// Keep the same baseline position for both directions
		// Only change the curve direction, not the overall position
		const baselineY = centerY;
		const arcRadius = adjustedRadius;

		// Create arc path with consistent positioning
		const startAngle = (-anglePerChar * (textLength - 1)) / 2;

		let startX: number;
		let startY: number;
		let endX: number;
		let endY: number;

		if (direction === "up") {
			// Curve upward - arc center is below the baseline
			const arcCenterY = baselineY + arcRadius;
			startX = centerX + arcRadius * Math.sin(startAngle);
			startY = arcCenterY - arcRadius * Math.cos(startAngle);
			endX = centerX + arcRadius * Math.sin(-startAngle);
			endY = arcCenterY - arcRadius * Math.cos(-startAngle);
		} else {
			// Curve downward - arc center is above the baseline
			const arcCenterY = baselineY - arcRadius;
			startX = centerX + arcRadius * Math.sin(startAngle);
			startY = arcCenterY + arcRadius * Math.cos(startAngle);
			endX = centerX + arcRadius * Math.sin(-startAngle);
			endY = arcCenterY + arcRadius * Math.cos(-startAngle);
		}

		const largeArcFlag = Math.abs(startAngle * 2) > Math.PI ? 1 : 0;
		const sweepFlag = direction === "up" ? 1 : 0;

		path = `M ${startX} ${startY} A ${arcRadius} ${arcRadius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
		return path;
	};

	// Get clip-path to crop the parts outside canvas - improved for curved text
	const getClipPath = () => {
		if (!canvasWidth || !canvasHeight) return undefined;

		const textX = text.position.x || 0;
		const textY = text.position.y || 0;
		const textW = text.width || 200;
		const textH = text.height || 100;

		// For curved text, we need more generous clipping bounds
		// because the curve might extend beyond the element bounds
		let effectiveX = textX;
		let effectiveY = textY;
		let effectiveW = textW;
		let effectiveH = textH;

		if (curved) {
			// Expand bounds to account for curve overflow
			const curveExtension = curveRadius * curveIntensity * 0.5;
			effectiveX = textX - curveExtension;
			effectiveY = textY - curveExtension;
			effectiveW = textW + curveExtension * 2;
			effectiveH = textH + curveExtension * 2;
		}

		// Calculate the visible rectangle relative to the text element
		const clipLeft = Math.max(0, -effectiveX);
		const clipTop = Math.max(0, -effectiveY);
		const clipRight = Math.min(effectiveW, canvasWidth - effectiveX);
		const clipBottom = Math.min(effectiveH, canvasHeight - effectiveY);

		// If text is completely outside canvas
		if (clipRight <= clipLeft || clipBottom <= clipTop) {
			return "inset(100% 100% 100% 100%)"; // Hide completely
		}

		// Convert to percentages for clip-path
		const leftPercent = Math.max(0, (clipLeft / effectiveW) * 100);
		const topPercent = Math.max(0, (clipTop / effectiveH) * 100);
		const rightPercent = Math.max(
			0,
			((effectiveW - clipRight) / effectiveW) * 100,
		);
		const bottomPercent = Math.max(
			0,
			((effectiveH - clipBottom) / effectiveH) * 100,
		);

		// Only apply clip-path if there's actual cropping needed
		if (
			clipLeft > 0 ||
			clipTop > 0 ||
			clipRight < effectiveW ||
			clipBottom < effectiveH
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
			// For curved text, set a minimum height based on font size and curve
			const minHeight = fontSizeNum * 2.5 + curveRadius * curveIntensity * 0.3;
			setTemplate((prev) => ({
				...prev,
				texts: prev.texts.map((t) =>
					t.id === text.id ? { ...t, height: Math.max(minHeight, 100) } : t,
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

	const getContainerStyle = (): React.CSSProperties => ({
		position: "absolute",
		left: (text.position.x || 0) * scale,
		top: (text.position.y || 0) * scale,
		width: (text.width || 200) * scale,
		height: (text.height || 100) * scale,
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
		overflow: "hidden",
		zIndex: layerIndex,
		padding: `${(Number(padding) || 0) * scale}px`,
		display: "flex",
		alignItems: "flex-start",
		justifyContent: "flex-start",
		paddingBottom: 0,
	});

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
			onResizeStart(
				e,
				text.id,
				direction,
				text.width || 200,
				text.height || 100,
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

					if (getSnapPosition && isSnapping && isMovingSlowly) {
						newPosition = getSnapPosition(
							newPosition,
							text.width || 200,
							text.height || 100,
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

	// Render curved text using SVG with proper scaling
	const renderCurvedText = () => {
		if (!curved || !text.content.trim()) return null;

		const pathId = `curve-path-${text.id}`;
		const textPath = createCurvedTextPath(
			text.content,
			curveRadius,
			curveDirection,
		);

		// Calculate scaled stroke width
		const scaledStrokeWidth = text.style.outlineWidth
			? Number.parseFloat(String(text.style.outlineWidth)) * scale
			: scale;

		return (
			<svg
				ref={svgRef}
				width="100%"
				height="100%"
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					overflow: "visible",
				}}
			>
				<title>Curved text: {text.content}</title>
				<defs>
					<path id={pathId} d={textPath} />
				</defs>
				<text
					style={
						{
							fontFamily: text.style.fontFamily,
							fontSize: fontSizeNum * scale,
							fontWeight: text.style.fontWeight,
							fill: text.style.color,
							letterSpacing:
								(letterSpacing || "normal") === "normal"
									? "normal"
									: `${Number.parseFloat(String(letterSpacing || "0")) * scale}px`,
							stroke:
								textStroke || WebkitTextStroke
									? text.style.outlineColor || "#000000"
									: "none",
							strokeWidth:
								textStroke || WebkitTextStroke ? scaledStrokeWidth : 0,
							paintOrder: "stroke fill",
						} as React.CSSProperties
					}
					textAnchor="middle"
					dominantBaseline="middle"
				>
					<textPath href={`#${pathId}`} startOffset="50%">
						{text.content}
					</textPath>
				</text>
			</svg>
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
							display: curved ? "none" : "block",
						}}
					/>
				) : (
					<>
						{curved && !isActive ? (
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
