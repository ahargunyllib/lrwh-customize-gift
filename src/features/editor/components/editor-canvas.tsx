"use client";
import { Input } from "@/shared/components/ui/input";
import type {
	ImageElement,
	Position,
	TemplateData,
	TextElement,
} from "@/shared/types/template";
import type React from "react";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";

interface EditorCanvasProps {
	template: TemplateData;
	activeElement: string | null;
	setActiveElement: (id: string | null) => void;
	setTemplate: React.Dispatch<React.SetStateAction<TemplateData>>;
	scale: number;
}

const EditorCanvas = forwardRef<HTMLDivElement, EditorCanvasProps>(
	({ template, activeElement, setActiveElement, setTemplate, scale }, ref) => {
		const [editingTextId, setEditingTextId] = useState<string | null>(null);

		// Listen for imageReplace events
		useEffect(() => {
			const handleImageReplace = (e: Event) => {
				const customEvent = e as CustomEvent<{ id: string; src: string }>;
				const { id, src } = customEvent.detail;
				setTemplate((prev) => ({
					...prev,
					images: prev.images.map((img) =>
						img.id === id ? { ...img, src } : img,
					),
				}));
			};
			document.addEventListener("imageReplace", handleImageReplace);
			return () =>
				document.removeEventListener("imageReplace", handleImageReplace);
		}, [setTemplate]);

		const handleCanvasDrop = (e: React.DragEvent) => {
			e.preventDefault();
		};
		const handleCanvasDragOver = (e: React.DragEvent) => e.preventDefault();

		const handleTextDoubleClick = (id: string) => setEditingTextId(id);
		const handleTextInputChange = (
			e: React.ChangeEvent<HTMLInputElement>,
			id: string,
		) => {
			setTemplate((prev) => ({
				...prev,
				texts: prev.texts.map((t) =>
					t.id === id ? { ...t, content: e.target.value } : t,
				),
			}));
		};
		const handleTextInputBlur = () => setEditingTextId(null);
		const handleTextInputKeyDown = (e: React.KeyboardEvent) => {
			if (e.key === "Enter") setEditingTextId(null);
		};

		useEffect(() => {
			const handleElementMove = (e: Event) => {
				const customEvent = e as CustomEvent<{
					id: string;
					type: string;
					position: Position;
				}>;
				const { id, type, position } = customEvent.detail;

				setTemplate((prev) => {
					if (type === "image") {
						return {
							...prev,
							images: prev.images.map((img) =>
								img.id === id ? { ...img, position } : img,
							),
						};
						// biome-ignore lint/style/noUselessElse: <explanation>
					} else if (type === "text") {
						return {
							...prev,
							texts: prev.texts.map((txt) =>
								txt.id === id ? { ...txt, position } : txt,
							),
						};
					}
					return prev;
				});
			};

			document.addEventListener("elementMove", handleElementMove);
			return () =>
				document.removeEventListener("elementMove", handleElementMove);
		}, [setTemplate]);

		return (
			// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
			<div
				ref={ref}
				className="relative bg-white shadow-lg"
				style={{
					width: template.width * scale,
					height: template.height * scale,
					transform: `scale(${scale})`,
					transformOrigin: "top left",
				}}
				onClick={() => setActiveElement(null)}
				onDrop={handleCanvasDrop}
				onDragOver={handleCanvasDragOver}
				data-canvas="true"
			>
				{/* Background */}
				<div
					className="absolute inset-0"
					style={{
						backgroundColor: template.backgroundColor,
						backgroundImage: template.backgroundImage
							? `url(${template.backgroundImage})`
							: undefined,
						backgroundSize: "cover",
						backgroundPosition: "center",
					}}
				/>

				{/* Images */}
				{template.images.map((image) => (
					<TemplateImage
						key={image.id}
						image={image}
						isActive={activeElement === image.id}
						onClick={(e) => {
							e.stopPropagation();
							setActiveElement(image.id);
						}}
						scale={scale}
					/>
				))}

				{/* Texts */}
				{template.texts.map((text) => (
					<TemplateText
						key={text.id}
						text={text}
						isActive={activeElement === text.id}
						isEditing={editingTextId === text.id}
						onClick={(e) => {
							e.stopPropagation();
							setActiveElement(text.id);
						}}
						onDoubleClick={() => handleTextDoubleClick(text.id)}
						onInputChange={(e) => handleTextInputChange(e, text.id)}
						onInputBlur={handleTextInputBlur}
						onInputKeyDown={handleTextInputKeyDown}
						scale={scale}
					/>
				))}
			</div>
		);
	},
);

EditorCanvas.displayName = "EditorCanvas";

// TemplateImage component (unchanged)
function TemplateImage({
	image,
	isActive,
	onClick,
	scale = 1,
}: {
	image: ImageElement;
	isActive: boolean;
	onClick: (e: React.MouseEvent) => void;
	scale?: number;
}) {
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
			const rect = e.currentTarget.getBoundingClientRect();
			setDragOffset({
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			});
			setIsDragging(true);
		}
	};

	useEffect(() => {
		if (!isDragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			if (isDragging) {
				const canvas = document.querySelector('[data-canvas="true"]');
				if (canvas) {
					const canvasRect = canvas.getBoundingClientRect();
					const newX = (e.clientX - canvasRect.left - dragOffset.x) / scale;
					const newY = (e.clientY - canvasRect.top - dragOffset.y) / scale;

					document.dispatchEvent(
						new CustomEvent("elementMove", {
							detail: {
								id: image.id,
								type: "image",
								position: { x: newX, y: newY },
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
	}, [isDragging, dragOffset, image.id, scale]);

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
		<div
			ref={dropZoneRef}
			className={`absolute ${isActive ? "ring-2 ring-blue-500" : ""} ${isDragOver ? "ring-2 ring-green-500" : ""}`}
			style={{
				left: image.position.x,
				top: image.position.y,
				width: image.width,
				height: image.height,
			}}
			onClick={onClick}
			onDragEnter={handleDragEnter}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			onMouseDown={handleMouseDown}
		>
			<img
				src={image.src || "https://placecats.com/300/200"}
				alt="Template element"
				className="w-full h-full object-cover pointer-events-none"
				draggable={false}
			/>
			{isDragOver && (
				<div className="absolute inset-0 bg-green-500/20 flex items-center justify-center pointer-events-none">
					<div className="bg-white/80 px-2 py-1 rounded text-xs font-medium">
						Drop to replace
					</div>
				</div>
			)}
		</div>
	);
}

function TemplateText({
	text,
	isActive,
	isEditing,
	onClick,
	onDoubleClick,
	onInputChange,
	onInputBlur,
	onInputKeyDown,
	scale = 1,
}: {
	text: TextElement;
	isActive: boolean;
	isEditing: boolean;
	onClick: (e: React.MouseEvent) => void;
	onDoubleClick: () => void;
	onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onInputBlur: () => void;
	onInputKeyDown: (e: React.KeyboardEvent) => void;
	scale?: number;
}) {
	const {
		curved,
		curveRadius = 100,
		curveDirection = "up",
		rotate = 0,
		centerX = false,
		maxWidth,
		height,
		backgroundColor,
		borderRadius,
		padding,
		paddingTop,
		paddingRight,
		paddingBottom,
		paddingLeft,
		paddingX,
		paddingY,
		paddingCenter,
		letterSpacing,
	} = text.style;

	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

	const fontSizeNum =
		typeof text.style.fontSize === "string"
			? Number.parseFloat(text.style.fontSize)
			: text.style.fontSize;

	const approxWidth = text.content.length * (fontSizeNum * 0.6);
	const sweepFlag = curveDirection === "up" ? 0 : 1;

	const computedPadding: React.CSSProperties = {
		padding,
		paddingTop: paddingTop ?? paddingY,
		paddingBottom: paddingBottom ?? paddingY,
		paddingLeft: paddingLeft ?? paddingX,
		paddingRight: paddingRight ?? paddingX,
	};

	const wrapperStyle: React.CSSProperties = {
		position: "absolute",
		top: text.position.y,
		transform: `rotate(${rotate}deg)`,
		transformOrigin: "center center",
		...(centerX || paddingCenter
			? { left: 0, right: 0, textAlign: "center" as const }
			: { left: text.position.x }),
	};

	const contentWrapperStyle: React.CSSProperties = {
		display: "inline-block",
		fontFamily: text.style.fontFamily,
		fontSize: fontSizeNum,
		fontWeight: text.style.fontWeight,
		color: text.style.color,
		backgroundColor,
		borderRadius,
		height,
		maxWidth: maxWidth ?? undefined,
		lineHeight: text.style.lineHeight,
		textAlign: text.style.textAlign as React.CSSProperties["textAlign"],
		whiteSpace: "pre-wrap",
		overflowWrap: "break-word",
		letterSpacing,
		...computedPadding,
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		if (text.draggable && !isEditing) {
			e.preventDefault();
			const rect = e.currentTarget.getBoundingClientRect();
			setDragOffset({
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			});
			setIsDragging(true);
		}
	};

	useEffect(() => {
		if (!isDragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			if (isDragging) {
				const canvas = document.querySelector('[data-canvas="true"]');
				if (canvas) {
					const canvasRect = canvas.getBoundingClientRect();
					const newX = (e.clientX - canvasRect.left - dragOffset.x) / scale;
					const newY = (e.clientY - canvasRect.top - dragOffset.y) / scale;

					document.dispatchEvent(
						new CustomEvent("elementMove", {
							detail: {
								id: text.id,
								type: "text",
								position: { x: newX, y: newY },
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
	}, [isDragging, dragOffset, text.id, scale]);

	return (
		<div
			className={isActive ? "ring-2 ring-blue-500 absolute" : "absolute"}
			style={wrapperStyle}
			onClick={(e) => {
				e.stopPropagation();
				onClick(e);
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onClick(e as unknown as React.MouseEvent);
				}
			}}
			onDoubleClick={(e) => {
				e.stopPropagation();
				onDoubleClick();
			}}
			onMouseDown={handleMouseDown}
		>
			{isEditing ? (
				<Input
					value={text.content}
					onChange={onInputChange}
					onBlur={onInputBlur}
					onKeyDown={onInputKeyDown}
					autoFocus
					className="min-w-[200px]"
					style={contentWrapperStyle}
				/>
			) : (
				<div style={contentWrapperStyle}>
					{curved ? (
						// biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
						<svg
							width={approxWidth + 2}
							height={curveRadius + fontSizeNum}
							viewBox={`0 -${curveRadius} ${approxWidth + 2} ${curveRadius + fontSizeNum}`}
							style={{ overflow: "visible" }}
						>
							<defs>
								<path
									id={`curve-path-${text.id}`}
									d={`M 0,0 A ${curveRadius},${curveRadius} 0 0,${sweepFlag} ${approxWidth},0`}
								/>
							</defs>
							<text
								fontFamily={text.style.fontFamily}
								fontSize={fontSizeNum}
								fontWeight={text.style.fontWeight}
								fill={text.style.color}
								style={{ letterSpacing }}
							>
								<textPath
									href={`#curve-path-${text.id}`}
									startOffset="50%"
									textAnchor="middle"
								>
									{text.content}
								</textPath>
							</text>
						</svg>
					) : (
						text.content
					)}
				</div>
			)}
		</div>
	);
}

export default EditorCanvas;
