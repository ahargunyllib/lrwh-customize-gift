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
}: TemplateTextProps) {
	const {
		rotate = 0,
		backgroundColor,
		borderRadius,
		padding = 8,
		letterSpacing,
	} = text.style;

	const textRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

	const fontSizeNum =
		typeof text.style.fontSize === "string"
			? Number.parseFloat(text.style.fontSize)
			: text.style.fontSize || 16;

	// Calculate scaled values
	const scaledFontSize = fontSizeNum * scale;
	const scaledPadding =
		(typeof padding === "string" ? Number.parseFloat(padding) : padding || 8) *
		scale;
	const scaledLetterSpacing =
		typeof letterSpacing === "string"
			? letterSpacing.includes("px")
				? `${Number.parseFloat(letterSpacing) * scale}px`
				: letterSpacing
			: typeof letterSpacing === "number"
				? letterSpacing * scale
				: "normal";

	// Auto-resize textarea height when editing
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (isEditing && textareaRef.current) {
			const textarea = textareaRef.current;
			textarea.style.height = "auto";
			const newHeight = textarea.scrollHeight;
			textarea.style.height = `${newHeight}px`;

			// Convert back to unscaled height for template storage
			const unscaledHeight = newHeight / scale;

			setTemplate((prev) => ({
				...prev,
				texts: prev.texts.map((t) =>
					t.id === text.id ? { ...t, height: unscaledHeight } : t,
				),
			}));
		}
	}, [text.content, isEditing, text.id, setTemplate, scale]);

	const getContainerStyle = (): React.CSSProperties => ({
		position: "absolute",
		left: (text.position.x || 0) * scale,
		top: (text.position.y || 0) * scale,
		width: (text.width || 200) * scale,
		height: (text.height || 100) * scale,
		transform: `rotate(${rotate}deg)`,
		transformOrigin: "center center",
		backgroundColor: backgroundColor || "transparent",
		borderRadius: (borderRadius || 0) * scale,
		border: isActive ? "2px solid #3b82f6" : "2px solid transparent",
		cursor: text.draggable && !isEditing ? "move" : "default",
		boxSizing: "border-box",
	});

	const getTextStyle = (): React.CSSProperties => ({
		width: "100%",
		height: "100%",
		fontFamily: text.style.fontFamily,
		fontSize: scaledFontSize, // Apply scale to font size
		fontWeight: text.style.fontWeight,
		color: text.style.color,
		lineHeight: text.style.lineHeight || "1.4",
		textAlign: (text.style.textAlign ||
			"left") as React.CSSProperties["textAlign"],
		padding: scaledPadding, // Apply scale to padding
		margin: 0,
		border: "none",
		outline: "none",
		background: "transparent",
		resize: "none",
		overflow: "hidden",
		wordWrap: "break-word",
		whiteSpace: "pre-wrap",
		letterSpacing: scaledLetterSpacing, // Apply scale to letter spacing
		boxSizing: "border-box",
	});

	const getDisplayStyle = (): React.CSSProperties => ({
		width: "100%",
		height: "100%",
		fontFamily: text.style.fontFamily,
		fontSize: scaledFontSize, // Apply scale to font size
		fontWeight: text.style.fontWeight,
		color: text.style.color,
		lineHeight: text.style.lineHeight || "1.4",
		textAlign: (text.style.textAlign ||
			"left") as React.CSSProperties["textAlign"],
		padding: scaledPadding, // Apply scale to padding
		margin: 0,
		border: "none",
		outline: "none",
		background: "transparent",
		wordWrap: "break-word",
		whiteSpace: "pre-wrap",
		letterSpacing: scaledLetterSpacing, // Apply scale to letter spacing
		boxSizing: "border-box",
		overflow: "hidden",
		display: "flex",
		alignItems: "flex-start",
		justifyContent: "flex-start",
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

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newContent = e.target.value;

		setTemplate((prev) => ({
			...prev,
			texts: prev.texts.map((t) =>
				t.id === text.id
					? {
							...t,
							content: newContent,
							style: {
								...t.style,
								fontSize: t.style.fontSize,
							},
						}
					: t,
			),
		}));

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

					if (constrainToCanvas) {
						newPosition = constrainToCanvas(
							newPosition,
							text.width || 200,
							text.height || 100,
						);
					}

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
		constrainToCanvas,
		isSnapping,
	]);

	return (
		<>
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
						// biome-ignore lint/a11y/noAutofocus: <explanation>
						autoFocus
						style={getTextStyle()}
					/>
				) : (
					<div style={getDisplayStyle()}>{text.content}</div>
				)}

				{/* Resize Handles - Scale the handle size and position */}
				{isActive && !isEditing && (
					<>
						{/* Edge handles - untuk resize width/height saja */}
						<div
							className="absolute border border-white bg-blue-500"
							style={{
								left: -3 * scale,
								top: "50%",
								transform: "translateY(-50%)",
								width: 6 * scale,
								height: 6 * scale,
								cursor: "w-resize",
							}}
							onMouseDown={(e) => handleResizeMouseDown(e, "w")}
							title="Resize width"
						/>
						<div
							className="absolute border border-white bg-blue-500"
							style={{
								right: -3 * scale,
								top: "50%",
								transform: "translateY(-50%)",
								width: 6 * scale,
								height: 6 * scale,
								cursor: "e-resize",
							}}
							onMouseDown={(e) => handleResizeMouseDown(e, "e")}
							title="Resize width"
						/>

						{/* Corner handles - untuk resize font size + border */}
						<div
							className="absolute border border-white bg-orange-500"
							style={{
								top: -3 * scale,
								left: -3 * scale,
								width: 6 * scale,
								height: 6 * scale,
								cursor: "nw-resize",
							}}
							onMouseDown={(e) => handleResizeMouseDown(e, "nw")}
							title="Resize font size + border"
						/>
						<div
							className="absolute border border-white bg-orange-500"
							style={{
								top: -3 * scale,
								right: -3 * scale,
								width: 6 * scale,
								height: 6 * scale,
								cursor: "ne-resize",
							}}
							onMouseDown={(e) => handleResizeMouseDown(e, "ne")}
							title="Resize font size + border"
						/>
						<div
							className="absolute border border-white bg-orange-500"
							style={{
								bottom: -3 * scale,
								left: -3 * scale,
								width: 6 * scale,
								height: 6 * scale,
								cursor: "sw-resize",
							}}
							onMouseDown={(e) => handleResizeMouseDown(e, "sw")}
							title="Resize font size + border"
						/>
						<div
							className="absolute border border-white bg-orange-500"
							style={{
								bottom: -3 * scale,
								right: -3 * scale,
								width: 6 * scale,
								height: 6 * scale,
								cursor: "se-resize",
							}}
							onMouseDown={(e) => handleResizeMouseDown(e, "se")}
							title="Resize font size + border"
						/>
					</>
				)}
			</div>
		</>
	);
}
