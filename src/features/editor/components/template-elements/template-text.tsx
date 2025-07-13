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
	const hiddenTextareaRef = useRef<HTMLTextAreaElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

	const fontSizeNum =
		typeof text.style.fontSize === "string"
			? Number.parseFloat(text.style.fontSize)
			: text.style.fontSize;

	const updateHeightFromTextarea = (content: string) => {
		if (hiddenTextareaRef.current) {
			const hiddenTextarea = hiddenTextareaRef.current;
			hiddenTextarea.value = content;
			hiddenTextarea.style.height = "auto";
			const newHeight = hiddenTextarea.scrollHeight;

			setTemplate((prev) => ({
				...prev,
				texts: prev.texts.map((t) =>
					t.id === text.id ? { ...t, height: newHeight } : t,
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
	]);

	// Auto-resize textarea height when editing
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (isEditing && textareaRef.current) {
			const textarea = textareaRef.current;
			textarea.style.height = "auto";
			const newHeight = textarea.scrollHeight;
			textarea.style.height = `${newHeight}px`;

			// Update template height to match textarea
			setTemplate((prev) => ({
				...prev,
				texts: prev.texts.map((t) =>
					t.id === text.id ? { ...t, height: newHeight } : t,
				),
			}));
		}
	}, [text.content, isEditing, text.id, setTemplate]);

	const getContainerStyle = (): React.CSSProperties => ({
		position: "absolute",
		left: (text.position.x || 0) * scale,
		top: (text.position.y || 0) * scale,
		width: (text.width || 200) * scale,
		height: (text.height || 100) * scale,
		transform: `rotate(${rotate}deg)`,
		transformOrigin: "center center",
		backgroundColor: backgroundColor || "transparent",
		borderRadius: borderRadius || 0,
		border: isActive ? "2px solid #3b82f6" : "2px solid transparent",
		cursor: text.draggable && !isEditing ? "move" : "default",
		boxSizing: "border-box",
	});

	const getTextStyle = (): React.CSSProperties => ({
		width: "100%",
		height: "100%",
		fontFamily: text.style.fontFamily,
		fontSize: fontSizeNum,
		fontWeight: text.style.fontWeight,
		color: text.style.color,
		lineHeight: text.style.lineHeight || "1.4",
		textAlign: (text.style.textAlign ||
			"left") as React.CSSProperties["textAlign"],
		padding: padding || 8,
		margin: 0,
		border: "none",
		outline: "none",
		background: "transparent",
		resize: "none",
		overflow: "hidden",
		wordWrap: "break-word",
		whiteSpace: "pre-wrap",
		letterSpacing: letterSpacing || "normal",
		boxSizing: "border-box",
	});

	const getDisplayStyle = (): React.CSSProperties => ({
		width: "100%",
		height: "100%",
		fontFamily: text.style.fontFamily,
		fontSize: fontSizeNum,
		fontWeight: text.style.fontWeight,
		color: text.style.color,
		lineHeight: text.style.lineHeight || "1.4",
		textAlign: (text.style.textAlign ||
			"left") as React.CSSProperties["textAlign"],
		padding: padding || 8,
		margin: 0,
		border: "none",
		outline: "none",
		background: "transparent",
		wordWrap: "break-word",
		whiteSpace: "pre-wrap",
		letterSpacing: letterSpacing || "normal",
		boxSizing: "border-box",
		overflow: "hidden",
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
		constrainToCanvas,
		isSnapping,
	]);

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
						// biome-ignore lint/a11y/noAutofocus: <explanation>
						autoFocus
						style={getTextStyle()}
					/>
				) : (
					<div style={getDisplayStyle()}>{text.content}</div>
				)}

				{/* Resize Handles - Only horizontal resize handles for text */}
				{isActive && !isEditing && (
					<>
						{/* Horizontal edge */}
						<div
							className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 border border-white cursor-w-resize"
							onMouseDown={(e) => handleResizeMouseDown(e, "w")}
						/>
						<div
							className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 border border-white cursor-e-resize"
							onMouseDown={(e) => handleResizeMouseDown(e, "e")}
						/>

						{/* Corner */}
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
		</>
	);
}
