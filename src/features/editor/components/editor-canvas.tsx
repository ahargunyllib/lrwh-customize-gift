"use client";

import { useCanvasDrop } from "@/features/editor/hooks/use-canvas-drop";
import { useElementCenter } from "@/features/editor/hooks/use-element-center";
import { useElementMove } from "@/features/editor/hooks/use-element-move";
import { useImageReplace } from "@/features/editor/hooks/use-image-replace";
import { useKeyboardDelete } from "@/features/editor/hooks/use-keyboard-delete";
import { validateTextElement } from "@/shared/lib/elements";
import type { TemplateData } from "@/shared/types/template";
import { Printer } from "lucide-react";
import type React from "react";
import { forwardRef, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAlignmentGuides } from "../hooks/use-allignment-guides";
import { useAutoTextHeight } from "../hooks/use-auto-text-height";
import { useResizeImage } from "../hooks/use-resize-image";
import { useResizeText } from "../hooks/use-resize-text";
import AlignmentGuides from "./template-elements/allignment-guides";
import TemplateImage from "./template-elements/template-image";
import TemplateLine from "./template-elements/template-line";
import TemplateShape from "./template-elements/template-shape";
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
	getLayerIndex: (id: string) => number;
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
			getLayerIndex,
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

		const {
			resizingImageId,
			setResizingImageId,
			handleResizeStart: handleImageResizeStart,
		} = useResizeImage({
			setTemplate,
			scale,
		});

		const {
			resizingTextId,
			setResizingTextId,
			handleResizeStart: handleTextResizeStart,
		} = useResizeText({
			setTemplate,
			scale,
		});

		const { updateTextHeight } = useAutoTextHeight({ setTemplate });

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

		// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
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
				shapes: [],
				lines: [],
				layer: [],
			});
		}, [
			initialTemplate,
			isCustomizing,
			// setTemplate,
			// template.width,
			// template.height,
		]);

		return (
			<>
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
				<div
					ref={ref}
					className="relative bg-white shadow-lg overflow-clip"
					style={{
						width: template.width * scale,
						height: template.height * scale,
						transform: `scale(${scale})`,
						transformOrigin: "center center",
					}}
					onClick={() => setActiveElement(null)}
					onDrop={handleCanvasDrop}
					onDragOver={handleCanvasDragOver}
					data-canvas="true"
				>
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

					<AlignmentGuides
						scale={scale}
						guides={guides}
						canvasWidth={template.width}
						canvasHeight={template.height}
					/>

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
							onResizeStart={handleImageResizeStart}
							getSnapPosition={getSnapPosition}
							constrainToCanvas={constrainToCanvas}
							isSnapping={isSnapping}
							canvasWidth={template.width}
							canvasHeight={template.height}
						/>
					))}

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
										t.id === text.id
											? validateTextElement({ ...t, content: e.target.value })
											: t,
									),
								}))
							}
							onInputBlur={() => setEditingTextId(null)}
							onInputKeyDown={(e) => {
								if (e.key === "Enter" && e.ctrlKey) {
									setEditingTextId(null);
								}
							}}
							scale={scale}
							getSnapPosition={getSnapPosition}
							constrainToCanvas={constrainToCanvas}
							isSnapping={isSnapping}
							canvasWidth={template.width}
							canvasHeight={template.height}
							onResizeStart={handleTextResizeStart}
							setTemplate={setTemplate}
						/>
					))}

					{/* Shapes */}
					{template.shapes.map((shape) => (
						<TemplateShape
							key={shape.id}
							element={shape}
							isElementActive={activeElement === shape.id}
							toggleActive={(e) => {
								e.stopPropagation();
								setActiveElement(shape.id);
							}}
							scale={scale}
							isCustomizing={isCustomizing}
							isSnapping={isSnapping}
							canvasSize={{
								width: template.width,
								height: template.height,
							}}
							getSnapPosition={getSnapPosition}
							constrainToCanvas={constrainToCanvas}
							canvasWidth={template.width}
							canvasHeight={template.height}
							layerIndex={getLayerIndex(shape.id)}
							isPreview={!allowDelete}
						/>
					))}

					{/* Lines */}
					{template.lines.map((line) => (
						<TemplateLine
							key={line.id}
							element={line}
							isElementActive={activeElement === line.id}
							toggleActive={(e) => {
								e.stopPropagation();
								setActiveElement(line.id);
							}}
							scale={scale}
							isCustomizing={isCustomizing}
							getSnapPosition={getSnapPosition}
							constrainToCanvas={constrainToCanvas}
							onUpdate={(updates) =>
								setTemplate((prev) => ({
									...prev,
									lines: prev.lines.map((l) =>
										l.id === line.id ? { ...l, ...updates } : l,
									),
								}))
							}
							canvasWidth={template.width}
							canvasHeight={template.height}
							layerIndex={getLayerIndex(line.id)}
							isPreview={!allowDelete}
						/>
					))}
					<div className="absolute -bottom-8 w-full text-center text-xs text-gray-500 flex items-center justify-center">
						<Printer className="inline h-3 w-3 mr-1" />
						{template.width}×{template.height}px&nbsp;(scale&nbsp;
						{scale.toFixed(2)})
					</div>
				</div>
			</>
		);
	},
);

EditorCanvas.displayName = "EditorCanvas";

export default EditorCanvas;
