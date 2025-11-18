"use client";

import type { ActiveElement } from "@/shared/types/element";
import type {
	ImageElement,
	LineElement,
	ShapeElement,
	TemplateData,
	TextElement,
} from "@/shared/types/template";
import { Printer } from "lucide-react";
import type React from "react";
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";

interface CanvasEditorProps {
	template: TemplateData;
	activeElement: ActiveElement;
	setActiveElement: React.Dispatch<React.SetStateAction<ActiveElement>>;
	setTemplate: React.Dispatch<React.SetStateAction<TemplateData>>;
	scale: number;
	isCustomizing?: boolean;
	allowDelete?: boolean;
	getLayerIndex: (id: string) => number;
}

type ElementType = ImageElement | TextElement | ShapeElement | LineElement;

interface DragState {
	elementId: string;
	elementType: "image" | "text" | "shape" | "line";
	startX: number;
	startY: number;
	startPosition: { x: number; y: number };
}

interface ResizeState {
	elementId: string;
	elementType: "image" | "text" | "shape" | "line";
	handle: string; // 'n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'
	startX: number;
	startY: number;
	startWidth: number;
	startHeight: number;
	startPosition: { x: number; y: number };
}

const CanvasEditor = forwardRef<HTMLCanvasElement, CanvasEditorProps>(
	(
		{
			template,
			activeElement,
			setActiveElement,
			setTemplate,
			scale,
			isCustomizing = false,
			allowDelete = true,
			getLayerIndex,
		},
		ref,
	) => {
		const canvasRef = useRef<HTMLCanvasElement>(null);
		const [dragState, setDragState] = useState<DragState | null>(null);
		const [resizeState, setResizeState] = useState<ResizeState | null>(null);
		const [editingTextId, setEditingTextId] = useState<string | null>(null);
		const [textInputPosition, setTextInputPosition] = useState<{
			x: number;
			y: number;
			width: number;
			height: number;
		} | null>(null);
		const loadedImages = useRef<Map<string, HTMLImageElement>>(new Map());
		const animationFrameId = useRef<number | undefined>(undefined);

		// Expose canvas ref to parent
		// biome-ignore lint/style/noNonNullAssertion: ref must exist
		useImperativeHandle(ref, () => canvasRef.current!, []);

		// Load image helper
		const loadImage = useCallback(
			async (src: string): Promise<HTMLImageElement> => {
				if (loadedImages.current.has(src)) {
					// biome-ignore lint/style/noNonNullAssertion: Map has() check ensures exists
					return loadedImages.current.get(src)!;
				}

				return new Promise((resolve, reject) => {
					const img = new Image();
					img.crossOrigin = "anonymous";
					img.onload = () => {
						loadedImages.current.set(src, img);
						resolve(img);
					};
					img.onerror = reject;
					img.src = src;
				});
			},
			[],
		);

		// Get element at position
		const getElementAtPosition = useCallback(
			(
				x: number,
				y: number,
			): {
				element: ElementType;
				type: "image" | "text" | "shape" | "line";
			} | null => {
				// Check in reverse layer order (top to bottom)
				const allElements: Array<{
					element: ElementType;
					type: "image" | "text" | "shape" | "line";
				}> = [
					...template.images.map((e) => ({
						element: e,
						type: "image" as const,
					})),
					...template.texts.map((e) => ({ element: e, type: "text" as const })),
					...template.shapes.map((e) => ({
						element: e,
						type: "shape" as const,
					})),
					...template.lines.map((e) => ({ element: e, type: "line" as const })),
				];

				allElements.sort((a, b) => {
					const aIndex = template.layer.indexOf(a.element.id);
					const bIndex = template.layer.indexOf(b.element.id);
					return bIndex - aIndex; // Reverse order
				});

				for (const { element, type } of allElements) {
					if (type === "line") {
						const line = element as LineElement;
						// Simple line hit detection (can be improved)
						const threshold = line.strokeWidth + 5;
						const dx = line.endPoint.x - line.startPoint.x;
						const dy = line.endPoint.y - line.startPoint.y;
						const length = Math.sqrt(dx * dx + dy * dy);
						const dot =
							((x - line.startPoint.x) * dx + (y - line.startPoint.y) * dy) /
							(length * length);

						if (dot >= 0 && dot <= 1) {
							const closestX = line.startPoint.x + dot * dx;
							const closestY = line.startPoint.y + dot * dy;
							const distance = Math.sqrt(
								(x - closestX) ** 2 + (y - closestY) ** 2,
							);
							if (distance <= threshold) {
								return { element, type };
							}
						}
					} else {
						const pos = (element as ImageElement | TextElement | ShapeElement)
							.position;
						const width = (element as ImageElement | TextElement | ShapeElement)
							.width;
						const height = (
							element as ImageElement | TextElement | ShapeElement
						).height;

						if (
							x >= pos.x &&
							x <= pos.x + width &&
							y >= pos.y &&
							y <= pos.y + height
						) {
							return { element, type };
						}
					}
				}

				return null;
			},
			[template],
		);

		// Get resize handle at position
		const getResizeHandle = useCallback(
			(x: number, y: number, element: ElementType): string | null => {
				if (!activeElement || activeElement.id !== element.id) return null;

				if ("startPoint" in element) return null; // Lines don't have resize handles

				const pos = (element as ImageElement | TextElement | ShapeElement)
					.position;
				const width = (element as ImageElement | TextElement | ShapeElement)
					.width;
				const height = (element as ImageElement | TextElement | ShapeElement)
					.height;

				const handleSize = 8;
				const handles = [
					{ name: "nw", x: pos.x, y: pos.y },
					{ name: "n", x: pos.x + width / 2, y: pos.y },
					{ name: "ne", x: pos.x + width, y: pos.y },
					{ name: "e", x: pos.x + width, y: pos.y + height / 2 },
					{ name: "se", x: pos.x + width, y: pos.y + height },
					{ name: "s", x: pos.x + width / 2, y: pos.y + height },
					{ name: "sw", x: pos.x, y: pos.y + height },
					{ name: "w", x: pos.x, y: pos.y + height / 2 },
				];

				for (const handle of handles) {
					if (
						Math.abs(x - handle.x) <= handleSize &&
						Math.abs(y - handle.y) <= handleSize
					) {
						return handle.name;
					}
				}

				return null;
			},
			[activeElement],
		);

		// Draw single image
		const drawImage = useCallback(
			async (ctx: CanvasRenderingContext2D, element: ImageElement) => {
				try {
					const img = await loadImage(element.src);

					ctx.save();

					if (element.rotate) {
						ctx.translate(
							element.position.x + element.width / 2,
							element.position.y + element.height / 2,
						);
						ctx.rotate((element.rotate * Math.PI) / 180);
						ctx.translate(
							-(element.position.x + element.width / 2),
							-(element.position.y + element.height / 2),
						);
					}

					if (element.borderRadius) {
						ctx.beginPath();
						const radius = element.borderRadius;
						const x = element.position.x;
						const y = element.position.y;
						const w = element.width;
						const h = element.height;

						ctx.moveTo(x + radius, y);
						ctx.lineTo(x + w - radius, y);
						ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
						ctx.lineTo(x + w, y + h - radius);
						ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
						ctx.lineTo(x + radius, y + h);
						ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
						ctx.lineTo(x, y + radius);
						ctx.quadraticCurveTo(x, y, x + radius, y);
						ctx.closePath();
						ctx.clip();
					}

					const scaleX = element.scaleX || 1;
					const scaleY = element.scaleY || 1;
					const offsetX = element.imageOffset?.x || 0;
					const offsetY = element.imageOffset?.y || 0;

					const sourceWidth = img.naturalWidth || img.width;
					const sourceHeight = img.naturalHeight || img.height;

					// Apply grayscale filter if needed
					if (element.grayscalePercent && element.grayscalePercent > 0) {
						ctx.filter = `grayscale(${element.grayscalePercent}%)`;
					}

					ctx.drawImage(
						img,
						offsetX,
						offsetY,
						sourceWidth / scaleX,
						sourceHeight / scaleY,
						element.position.x,
						element.position.y,
						element.width,
						element.height,
					);

					ctx.restore();
				} catch (error) {
					console.error(`Failed to draw image ${element.id}:`, error);
				}
			},
			[loadImage],
		);

		// Draw text
		const drawText = useCallback(
			(ctx: CanvasRenderingContext2D, element: TextElement) => {
				if (editingTextId === element.id) return; // Don't draw if editing

				ctx.save();

				if (element.rotate) {
					ctx.translate(
						element.position.x + element.width / 2,
						element.position.y + element.height / 2,
					);
					ctx.rotate((element.rotate * Math.PI) / 180);
					ctx.translate(
						-(element.position.x + element.width / 2),
						-(element.position.y + element.height / 2),
					);
				}

				// Background
				if (element.style.backgroundColor) {
					ctx.fillStyle = element.style.backgroundColor;
					if (element.style.borderRadius) {
						const r = element.style.borderRadius;
						const x = element.position.x;
						const y = element.position.y;
						const w = element.width;
						const h = element.height;

						ctx.beginPath();
						ctx.moveTo(x + r, y);
						ctx.lineTo(x + w - r, y);
						ctx.quadraticCurveTo(x + w, y, x + w, y + r);
						ctx.lineTo(x + w, y + h - r);
						ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
						ctx.lineTo(x + r, y + h);
						ctx.quadraticCurveTo(x, y + h, x, y + h - r);
						ctx.lineTo(x, y + r);
						ctx.quadraticCurveTo(x, y, x + r, y);
						ctx.closePath();
						ctx.fill();
					} else {
						ctx.fillRect(
							element.position.x,
							element.position.y,
							element.width,
							element.height,
						);
					}
				}

				const fontSize =
					typeof element.style.fontSize === "number"
						? element.style.fontSize
						: Number.parseFloat(element.style.fontSize);
				const fontWeight = element.style.fontWeight || "normal";
				const fontFamily = element.style.fontFamily || "Arial, sans-serif";

				ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
				ctx.fillStyle = element.style.color;
				ctx.textBaseline = "top";

				// Text stroke
				if (element.style.WebkitTextStroke || element.style.textStroke) {
					const strokeParts = (
						element.style.WebkitTextStroke || element.style.textStroke
					)?.split(" ");
					if (strokeParts && strokeParts.length >= 2) {
						ctx.lineWidth = Number.parseFloat(strokeParts[0]);
						ctx.strokeStyle = strokeParts.slice(1).join(" ");
					}
				}

				const padding =
					typeof element.style.padding === "number"
						? element.style.padding
						: Number.parseFloat(element.style.padding || "8");

				const lines = element.content.split("\n");
				const lineHeight =
					typeof element.style.lineHeight === "string"
						? fontSize * Number.parseFloat(element.style.lineHeight)
						: fontSize * element.style.lineHeight;

				const textAlign = element.style.textAlign || "left";
				const verticalAlign = element.style.verticalAlign || "top";

				let verticalOffset = padding;
				const totalTextHeight = lines.length * lineHeight;
				if (verticalAlign === "middle") {
					verticalOffset = (element.height - totalTextHeight) / 2;
				} else if (verticalAlign === "bottom") {
					verticalOffset = element.height - totalTextHeight - padding;
				}

				for (let i = 0; i < lines.length; i++) {
					const line = lines[i];
					const y = element.position.y + verticalOffset + i * lineHeight;

					let x = element.position.x + padding;
					const textWidth = ctx.measureText(line).width;

					if (textAlign === "center") {
						x = element.position.x + (element.width - textWidth) / 2;
					} else if (textAlign === "right") {
						x = element.position.x + element.width - textWidth - padding;
					}

					if (ctx.lineWidth > 0) {
						ctx.strokeText(line, x, y);
					}
					ctx.fillText(line, x, y);
				}

				ctx.restore();
			},
			[editingTextId],
		);

		// Draw shape
		const drawShape = useCallback(
			(ctx: CanvasRenderingContext2D, element: ShapeElement) => {
				ctx.save();

				if (element.rotation) {
					ctx.translate(
						element.position.x + element.width / 2,
						element.position.y + element.height / 2,
					);
					ctx.rotate((element.rotation * Math.PI) / 180);
					ctx.translate(
						-(element.position.x + element.width / 2),
						-(element.position.y + element.height / 2),
					);
				}

				ctx.globalAlpha = element.opacity || 1;
				ctx.fillStyle = element.fill;
				ctx.strokeStyle = element.borderColor;
				ctx.lineWidth = element.borderWidth || 0;

				const x = element.position.x;
				const y = element.position.y;
				const w = element.width;
				const h = element.height;

				switch (element.variant) {
					case "rectangle": {
						if (element.borderRadius > 0) {
							const r = element.borderRadius;
							ctx.beginPath();
							ctx.moveTo(x + r, y);
							ctx.lineTo(x + w - r, y);
							ctx.quadraticCurveTo(x + w, y, x + w, y + r);
							ctx.lineTo(x + w, y + h - r);
							ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
							ctx.lineTo(x + r, y + h);
							ctx.quadraticCurveTo(x, y + h, x, y + h - r);
							ctx.lineTo(x, y + r);
							ctx.quadraticCurveTo(x, y, x + r, y);
							ctx.closePath();
						} else {
							ctx.beginPath();
							ctx.rect(x, y, w, h);
						}
						break;
					}
					case "circle": {
						ctx.beginPath();
						ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
						break;
					}
					case "triangle": {
						ctx.beginPath();
						ctx.moveTo(x + w / 2, y);
						ctx.lineTo(x + w, y + h);
						ctx.lineTo(x, y + h);
						ctx.closePath();
						break;
					}
				}

				ctx.fill();
				if (element.borderWidth > 0) {
					ctx.stroke();
				}

				ctx.restore();
			},
			[],
		);

		// Draw line
		const drawLine = useCallback(
			(ctx: CanvasRenderingContext2D, element: LineElement) => {
				ctx.save();

				ctx.globalAlpha = element.opacity || 1;
				ctx.strokeStyle = element.strokeColor;
				ctx.lineWidth = element.strokeWidth;

				if (element.variant === "line-dashed") {
					ctx.setLineDash([10, 5]);
				} else if (element.variant === "line-dotted") {
					ctx.setLineDash([2, 5]);
				} else if (element.variant === "line-rounded") {
					ctx.lineCap = "round";
				}

				ctx.beginPath();
				ctx.moveTo(element.startPoint.x, element.startPoint.y);
				ctx.lineTo(element.endPoint.x, element.endPoint.y);
				ctx.stroke();

				ctx.restore();
			},
			[],
		);

		// Draw selection handles
		const drawSelectionHandles = useCallback(
			(ctx: CanvasRenderingContext2D, element: ElementType) => {
				if ("startPoint" in element) return; // No handles for lines

				const pos = (element as ImageElement | TextElement | ShapeElement)
					.position;
				const width = (element as ImageElement | TextElement | ShapeElement)
					.width;
				const height = (element as ImageElement | TextElement | ShapeElement)
					.height;

				ctx.save();

				// Selection box
				ctx.strokeStyle = "#2563eb";
				ctx.lineWidth = 2;
				ctx.strokeRect(pos.x, pos.y, width, height);

				// Resize handles
				const handleSize = 8;
				const handles = [
					{ x: pos.x, y: pos.y },
					{ x: pos.x + width / 2, y: pos.y },
					{ x: pos.x + width, y: pos.y },
					{ x: pos.x + width, y: pos.y + height / 2 },
					{ x: pos.x + width, y: pos.y + height },
					{ x: pos.x + width / 2, y: pos.y + height },
					{ x: pos.x, y: pos.y + height },
					{ x: pos.x, y: pos.y + height / 2 },
				];

				ctx.fillStyle = "#ffffff";
				ctx.strokeStyle = "#2563eb";
				ctx.lineWidth = 2;

				for (const handle of handles) {
					ctx.fillRect(
						handle.x - handleSize / 2,
						handle.y - handleSize / 2,
						handleSize,
						handleSize,
					);
					ctx.strokeRect(
						handle.x - handleSize / 2,
						handle.y - handleSize / 2,
						handleSize,
						handleSize,
					);
				}

				ctx.restore();
			},
			[],
		);

		// Main render function
		const render = useCallback(async () => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			// Clear canvas
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// Draw background
			ctx.fillStyle = template.backgroundColor;
			ctx.fillRect(0, 0, template.width, template.height);

			// Draw background image
			if (template.backgroundImage) {
				try {
					const bgImg = await loadImage(template.backgroundImage);
					ctx.drawImage(bgImg, 0, 0, template.width, template.height);
				} catch (error) {
					console.error("Failed to load background image:", error);
				}
			}

			// Get all elements sorted by layer
			const allElements: Array<{
				element: ElementType;
				type: "image" | "text" | "shape" | "line";
			}> = [
				...template.images.map((e) => ({ element: e, type: "image" as const })),
				...template.texts.map((e) => ({ element: e, type: "text" as const })),
				...template.shapes.map((e) => ({ element: e, type: "shape" as const })),
				...template.lines.map((e) => ({ element: e, type: "line" as const })),
			];

			allElements.sort((a, b) => {
				const aIndex = template.layer.indexOf(a.element.id);
				const bIndex = template.layer.indexOf(b.element.id);
				return aIndex - bIndex;
			});

			// Draw all elements
			for (const { element, type } of allElements) {
				switch (type) {
					case "image":
						await drawImage(ctx, element as ImageElement);
						break;
					case "text":
						drawText(ctx, element as TextElement);
						break;
					case "shape":
						drawShape(ctx, element as ShapeElement);
						break;
					case "line":
						drawLine(ctx, element as LineElement);
						break;
				}
			}

			// Draw selection handles
			if (activeElement) {
				const selected = allElements.find(
					(e) => e.element.id === activeElement.id,
				);
				if (selected) {
					drawSelectionHandles(ctx, selected.element);
				}
			}
		}, [
			template,
			activeElement,
			drawImage,
			drawText,
			drawShape,
			drawLine,
			drawSelectionHandles,
			loadImage,
		]);

		// Render loop
		useEffect(() => {
			const renderLoop = () => {
				render();
				animationFrameId.current = requestAnimationFrame(renderLoop);
			};

			renderLoop();

			return () => {
				if (animationFrameId.current) {
					cancelAnimationFrame(animationFrameId.current);
				}
			};
		}, [render]);

		// Mouse event handlers
		const handleMouseDown = useCallback(
			(e: React.MouseEvent<HTMLCanvasElement>) => {
				const canvas = canvasRef.current;
				if (!canvas) return;

				const rect = canvas.getBoundingClientRect();
				const x = (e.clientX - rect.left) / scale;
				const y = (e.clientY - rect.top) / scale;

				// Check for resize handle first
				if (activeElement) {
					const allElements = [
						...template.images,
						...template.texts,
						...template.shapes,
						...template.lines,
					];
					const element = allElements.find((el) => el.id === activeElement.id);

					if (element) {
						const handle = getResizeHandle(x, y, element);
						if (handle && "position" in element) {
							setResizeState({
								elementId: element.id,
								elementType: activeElement.type,
								handle,
								startX: x,
								startY: y,
								// biome-ignore lint/suspicious/noExplicitAny: element type is checked above
								startWidth: (element as any).width,
								// biome-ignore lint/suspicious/noExplicitAny: element type is checked above
								startHeight: (element as any).height,
								// biome-ignore lint/suspicious/noExplicitAny: element type is checked above
								startPosition: { ...(element as any).position },
							});
							return;
						}
					}
				}

				// Check for element click
				const clicked = getElementAtPosition(x, y);
				if (clicked) {
					setActiveElement({
						id: clicked.element.id,
						// biome-ignore lint/suspicious/noExplicitAny: type is narrowed correctly
						type: clicked.type as any,
					});

					// Start drag
					const pos =
						"position" in clicked.element
							? clicked.element.position
							: clicked.element.startPoint;
					setDragState({
						elementId: clicked.element.id,
						// biome-ignore lint/suspicious/noExplicitAny: type is narrowed correctly
						elementType: clicked.type as any,
						startX: x,
						startY: y,
						startPosition: { ...pos },
					});
				} else {
					setActiveElement(null);
				}
			},
			[
				activeElement,
				template,
				scale,
				getElementAtPosition,
				getResizeHandle,
				setActiveElement,
			],
		);

		const handleMouseMove = useCallback(
			(e: React.MouseEvent<HTMLCanvasElement>) => {
				const canvas = canvasRef.current;
				if (!canvas) return;

				const rect = canvas.getBoundingClientRect();
				const x = (e.clientX - rect.left) / scale;
				const y = (e.clientY - rect.top) / scale;

				// Handle resize
				if (resizeState) {
					const deltaX = x - resizeState.startX;
					const deltaY = y - resizeState.startY;

					let newWidth = resizeState.startWidth;
					let newHeight = resizeState.startHeight;
					let newX = resizeState.startPosition.x;
					let newY = resizeState.startPosition.y;

					switch (resizeState.handle) {
						case "e":
							newWidth = Math.max(20, resizeState.startWidth + deltaX);
							break;
						case "w":
							newWidth = Math.max(20, resizeState.startWidth - deltaX);
							newX = resizeState.startPosition.x + deltaX;
							break;
						case "n":
							newHeight = Math.max(20, resizeState.startHeight - deltaY);
							newY = resizeState.startPosition.y + deltaY;
							break;
						case "s":
							newHeight = Math.max(20, resizeState.startHeight + deltaY);
							break;
						case "ne":
							newWidth = Math.max(20, resizeState.startWidth + deltaX);
							newHeight = Math.max(20, resizeState.startHeight - deltaY);
							newY = resizeState.startPosition.y + deltaY;
							break;
						case "nw":
							newWidth = Math.max(20, resizeState.startWidth - deltaX);
							newHeight = Math.max(20, resizeState.startHeight - deltaY);
							newX = resizeState.startPosition.x + deltaX;
							newY = resizeState.startPosition.y + deltaY;
							break;
						case "se":
							newWidth = Math.max(20, resizeState.startWidth + deltaX);
							newHeight = Math.max(20, resizeState.startHeight + deltaY);
							break;
						case "sw":
							newWidth = Math.max(20, resizeState.startWidth - deltaX);
							newHeight = Math.max(20, resizeState.startHeight + deltaY);
							newX = resizeState.startPosition.x + deltaX;
							break;
					}

					setTemplate((prev) => {
						if (resizeState.elementType === "image") {
							return {
								...prev,
								images: prev.images.map((img) =>
									img.id === resizeState.elementId
										? {
												...img,
												width: newWidth,
												height: newHeight,
												position: { x: newX, y: newY },
											}
										: img,
								),
							};
						}
						if (resizeState.elementType === "text") {
							return {
								...prev,
								texts: prev.texts.map((txt) =>
									txt.id === resizeState.elementId
										? {
												...txt,
												width: newWidth,
												height: newHeight,
												position: { x: newX, y: newY },
											}
										: txt,
								),
							};
						}
						if (resizeState.elementType === "shape") {
							return {
								...prev,
								shapes: prev.shapes.map((shp) =>
									shp.id === resizeState.elementId
										? {
												...shp,
												width: newWidth,
												height: newHeight,
												position: { x: newX, y: newY },
											}
										: shp,
								),
							};
						}
						return prev;
					});
					return;
				}

				// Handle drag
				if (dragState) {
					const deltaX = x - dragState.startX;
					const deltaY = y - dragState.startY;

					const newX = dragState.startPosition.x + deltaX;
					const newY = dragState.startPosition.y + deltaY;

					setTemplate((prev) => {
						if (dragState.elementType === "image") {
							return {
								...prev,
								images: prev.images.map((img) =>
									img.id === dragState.elementId
										? { ...img, position: { x: newX, y: newY } }
										: img,
								),
							};
						}
						if (dragState.elementType === "text") {
							return {
								...prev,
								texts: prev.texts.map((txt) =>
									txt.id === dragState.elementId
										? { ...txt, position: { x: newX, y: newY } }
										: txt,
								),
							};
						}
						if (dragState.elementType === "shape") {
							return {
								...prev,
								shapes: prev.shapes.map((shp) =>
									shp.id === dragState.elementId
										? { ...shp, position: { x: newX, y: newY } }
										: shp,
								),
							};
						}
						if (dragState.elementType === "line") {
							return {
								...prev,
								lines: prev.lines.map((ln) =>
									ln.id === dragState.elementId
										? {
												...ln,
												startPoint: { x: newX, y: newY },
												endPoint: {
													x: ln.endPoint.x - ln.startPoint.x + newX,
													y: ln.endPoint.y - ln.startPoint.y + newY,
												},
											}
										: ln,
								),
							};
						}
						return prev;
					});
				}
			},
			[dragState, resizeState, scale, setTemplate],
		);

		const handleMouseUp = useCallback(() => {
			setDragState(null);
			setResizeState(null);
		}, []);

		// Handle double click for text editing
		const handleDoubleClick = useCallback(
			(e: React.MouseEvent<HTMLCanvasElement>) => {
				const canvas = canvasRef.current;
				if (!canvas) return;

				const rect = canvas.getBoundingClientRect();
				const x = (e.clientX - rect.left) / scale;
				const y = (e.clientY - rect.top) / scale;

				const clicked = getElementAtPosition(x, y);
				if (clicked && clicked.type === "text") {
					const textElement = clicked.element as TextElement;
					setEditingTextId(textElement.id);
					setTextInputPosition({
						x: textElement.position.x * scale,
						y: textElement.position.y * scale,
						width: textElement.width * scale,
						height: textElement.height * scale,
					});
				}
			},
			[scale, getElementAtPosition],
		);

		// Handle keyboard delete
		useEffect(() => {
			const handleKeyDown = (e: KeyboardEvent) => {
				if (
					(e.key === "Delete" || e.key === "Backspace") &&
					activeElement &&
					allowDelete &&
					!editingTextId
				) {
					setTemplate((prev) => ({
						...prev,
						images: prev.images.filter((img) => img.id !== activeElement.id),
						texts: prev.texts.filter((txt) => txt.id !== activeElement.id),
						shapes: prev.shapes.filter((shp) => shp.id !== activeElement.id),
						lines: prev.lines.filter((ln) => ln.id !== activeElement.id),
						layer: prev.layer.filter((id) => id !== activeElement.id),
					}));
					setActiveElement(null);
				}
			};

			document.addEventListener("keydown", handleKeyDown);
			return () => document.removeEventListener("keydown", handleKeyDown);
		}, [
			activeElement,
			allowDelete,
			editingTextId,
			setTemplate,
			setActiveElement,
		]);

		return (
			<div className="relative">
				<canvas
					ref={canvasRef}
					width={template.width}
					height={template.height}
					style={{
						width: template.width * scale,
						height: template.height * scale,
					}}
					className="relative bg-white shadow-lg cursor-default"
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onDoubleClick={handleDoubleClick}
				/>

				{/* Text editing overlay */}
				{editingTextId && textInputPosition && (
					<textarea
						className="absolute border-2 border-blue-500 bg-transparent resize-none outline-none"
						style={{
							left: textInputPosition.x,
							top: textInputPosition.y,
							width: textInputPosition.width,
							height: textInputPosition.height,
							fontSize: `${(Number.parseFloat(String(template.texts.find((t) => t.id === editingTextId)?.style.fontSize)) || 16) * scale}px`,
							fontFamily:
								template.texts.find((t) => t.id === editingTextId)?.style
									.fontFamily || "Arial",
							color:
								template.texts.find((t) => t.id === editingTextId)?.style
									.color || "#000",
						}}
						value={
							template.texts.find((t) => t.id === editingTextId)?.content || ""
						}
						onChange={(e) => {
							setTemplate((prev) => ({
								...prev,
								texts: prev.texts.map((txt) =>
									txt.id === editingTextId
										? { ...txt, content: e.target.value }
										: txt,
								),
							}));
						}}
						onBlur={() => {
							setEditingTextId(null);
							setTextInputPosition(null);
						}}
						onKeyDown={(e) => {
							if (e.key === "Escape" || (e.key === "Enter" && e.ctrlKey)) {
								setEditingTextId(null);
								setTextInputPosition(null);
							}
						}}
					/>
				)}

				<div className="absolute -bottom-8 w-full text-center text-xs text-gray-500 flex items-center justify-center">
					<Printer className="inline h-3 w-3 mr-1" />
					{template.width}×{template.height}px&nbsp;(scale&nbsp;
					{scale.toFixed(2)})
				</div>
			</div>
		);
	},
);

CanvasEditor.displayName = "CanvasEditor";

export default CanvasEditor;
