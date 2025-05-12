"use client";
import { forwardRef, useEffect, useState } from "react";
import type React from "react";

import type {
	ImageElement,
	Position,
	TemplateData,
} from "@/shared/types/template";
import { v4 as uuidv4 } from "uuid";
import { useAlignmentGuides } from "../hooks/use-allignment-guides";
import { useResizeImage } from "../hooks/use-resize-image";
import AlignmentGuides from "./template-elements/allignment-guides";
import TemplateImage from "./template-elements/template-image";
import TemplateText from "./template-elements/template-text";

interface EditorCanvasProps {
	template: TemplateData;
	activeElement: string | null;
	setActiveElement: (id: string | null) => void;
	setTemplate: React.Dispatch<React.SetStateAction<TemplateData>>;
	scale: number;
	isCustomizing?: boolean;
	initialTemplate?: TemplateData;
}

const EditorCanvas = forwardRef<HTMLDivElement, EditorCanvasProps>(
	(
		{
			template,
			activeElement,
			setActiveElement,
			setTemplate,
			scale,
			isCustomizing = false,
			initialTemplate,
		},
		ref,
	) => {
		const [editingTextId, setEditingTextId] = useState<string | null>(null);

		const { resizingImageId, setResizingImageId, handleResizeStart } =
			useResizeImage({ setTemplate, scale });

		const {
			guides,
			centerElement,
			isSnapping,
			getSnapPosition,
			constrainToCanvas,
		} = useAlignmentGuides({
			template,
			activeElement,
			scale,
		});

		useEffect(() => {
			if (initialTemplate && isCustomizing) {
				setTemplate(initialTemplate);
			} else if (isCustomizing) {
				const blankTemplate: TemplateData = {
					id: uuidv4(),
					name: "Custom Template",
					width: template.width,
					height: template.height,
					backgroundColor: "#ffffff",
					images: [],
					texts: [],
				};
				setTemplate(blankTemplate);
			}
		}, [
			initialTemplate,
			isCustomizing,
			setTemplate,
			template.width,
			template.height,
		]);

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

		useEffect(() => {
			const handleElementCenter = (e: Event) => {
				const customEvent = e as CustomEvent<{
					id: string;
					type: string;
					axis: "x" | "y" | "both";
				}>;
				const { id, type, axis } = customEvent.detail;

				setTemplate((prev) => {
					if (type === "image") {
						const image = prev.images.find((img) => img.id === id);
						if (!image) return prev;

						const newImage = { ...image };

						if (axis === "x" || axis === "both") {
							newImage.centerX = true;
						}

						if (axis === "y" || axis === "both") {
							newImage.centerY = true;
						}

						return {
							...prev,
							images: prev.images.map((img) =>
								img.id === id ? newImage : img,
							),
						};
					}

					if (type === "text") {
						const text = prev.texts.find((txt) => txt.id === id);
						if (!text) return prev;

						const newStyle = { ...text.style };

						if (axis === "x" || axis === "both") {
							newStyle.centerX = true;
						}

						if (axis === "y" || axis === "both") {
							newStyle.centerY = true;
						}

						return {
							...prev,
							texts: prev.texts.map((txt) =>
								txt.id === id ? { ...txt, style: newStyle } : txt,
							),
						};
					}

					return prev;
				});
			};

			document.addEventListener("elementCenter", handleElementCenter);
			return () =>
				document.removeEventListener("elementCenter", handleElementCenter);
		}, [setTemplate]);

		const handleCanvasDrop = (e: React.DragEvent) => {
			e.preventDefault();

			if (isCustomizing && e.dataTransfer.files && e.dataTransfer.files[0]) {
				const file = e.dataTransfer.files[0];
				if (file.type.startsWith("image/")) {
					const reader = new FileReader();
					reader.onload = (ev) => {
						if (ev.target?.result) {
							const canvasRect = e.currentTarget.getBoundingClientRect();
							const x = (e.clientX - canvasRect.left) / scale;
							const y = (e.clientY - canvasRect.top) / scale;

							const newImage: ImageElement = {
								id: uuidv4(),
								type: "image",
								src: ev.target.result as string,
								position: { x, y },
								width: 200,
								height: 200,
								draggable: true,
							};

							setTemplate((prev) => ({
								...prev,
								images: [...prev.images, newImage],
							}));

							setActiveElement(newImage.id);
						}
					};
					reader.readAsDataURL(file);
				}
			}
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
								img.id === id
									? {
											...img,
											position,
											centerX: false,
											centerY: false,
										}
									: img,
							),
						};
					}
					if (type === "text") {
						return {
							...prev,
							texts: prev.texts.map((txt) =>
								txt.id === id
									? {
											...txt,
											position,
											style: {
												...txt.style,
												centerX: false,
												centerY: false,
											},
										}
									: txt,
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

		const handleDeleteElement = () => {
			if (!activeElement) return;

			setTemplate((prev) => {
				const imageIndex = prev.images.findIndex(
					(img) => img.id === activeElement,
				);
				if (imageIndex >= 0) {
					const newImages = [...prev.images];
					newImages.splice(imageIndex, 1);
					return { ...prev, images: newImages };
				}

				const textIndex = prev.texts.findIndex(
					(txt) => txt.id === activeElement,
				);
				if (textIndex >= 0) {
					const newTexts = [...prev.texts];
					newTexts.splice(textIndex, 1);
					return { ...prev, texts: newTexts };
				}

				return prev;
			});

			setActiveElement(null);
		};

		// Handle keyboard events for delete
		// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
		useEffect(() => {
			const handleKeyDown = (e: KeyboardEvent) => {
				if (
					(e.key === "Delete" || e.key === "Backspace") &&
					activeElement &&
					!editingTextId
				) {
					handleDeleteElement();
				}
			};

			document.addEventListener("keydown", handleKeyDown);
			return () => document.removeEventListener("keydown", handleKeyDown);
		}, [activeElement, editingTextId]);

		return (
			<div className="relative">
				{/* Canvas */}
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
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

					{/* Alignment Guides */}
					<AlignmentGuides
						guides={guides}
						canvasWidth={template.width}
						canvasHeight={template.height}
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
							isCustomizing={isCustomizing}
							onResizeStart={handleResizeStart}
							getSnapPosition={getSnapPosition}
							constrainToCanvas={constrainToCanvas}
							isSnapping={isSnapping}
							canvasWidth={template.width}
							canvasHeight={template.height}
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
							getSnapPosition={getSnapPosition}
							constrainToCanvas={constrainToCanvas}
							isSnapping={isSnapping}
							canvasWidth={template.width}
							canvasHeight={template.height}
						/>
					))}
				</div>
			</div>
		);
	},
);

EditorCanvas.displayName = "EditorCanvas";

export default EditorCanvas;
