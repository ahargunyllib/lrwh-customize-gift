"use client";
import { forwardRef, useEffect, useState } from "react";
import type React from "react";
import { v4 as uuidv4 } from "uuid";

import type { TemplateData } from "@/shared/types/template";
import { useAlignmentGuides } from "../hooks/use-allignment-guides";
import { useResizeImage } from "../hooks/use-resize-image";

import { useCanvasDrop } from "@/features/editor/hooks/use-canvas-drop";
import { useElementCenter } from "@/features/editor/hooks/use-element-center";
import { useElementMove } from "@/features/editor/hooks/use-element-move";
import { useImageReplace } from "@/features/editor/hooks/use-image-replace";
import { useKeyboardDelete } from "@/features/editor/hooks/use-keyboard-delete";
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
	allowDelete?: boolean;
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
			allowDelete = true,
		},
		ref,
	) => {
		const [editingTextId, setEditingTextId] = useState<string | null>(null);

		useImageReplace(setTemplate);
		useElementCenter(setTemplate);
		useElementMove(setTemplate);
		useKeyboardDelete({
			activeElement,
			editingTextId,
			setActiveElement,
			setTemplate,
			allowDelete,
		});

		const { handleCanvasDrop, handleCanvasDragOver } = useCanvasDrop({
			isCustomizing,
			scale,
			setTemplate,
			setActiveElement,
		});

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
			if (!isCustomizing) return;
			if (initialTemplate) {
				setTemplate(initialTemplate);
				return;
			}
			setTemplate({
				id: uuidv4(),
				name: "Custom Template",
				width: template.width,
				height: template.height,
				backgroundColor: "#ffffff",
				images: [],
				texts: [],
			});
		}, [
			initialTemplate,
			isCustomizing,
			setTemplate,
			template.width,
			template.height,
		]);

		return (
			<div className="relative">
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
							onDoubleClick={() => setEditingTextId(text.id)}
							onInputChange={(e) =>
								setTemplate((prev) => ({
									...prev,
									texts: prev.texts.map((t) =>
										t.id === text.id ? { ...t, content: e.target.value } : t,
									),
								}))
							}
							onInputBlur={() => setEditingTextId(null)}
							onInputKeyDown={(e) => {
								if (e.key === "Enter") setEditingTextId(null);
							}}
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
