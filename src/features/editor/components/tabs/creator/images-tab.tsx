"use client";

import { useTemplateContext } from "@/features/editor/containers/template-creator";
import type React from "react";

import { useBackgroundCanvas } from "@/features/editor/hooks/use-background-canvas";
import { Button } from "@/shared/components/ui/button";
import { ImagePlus } from "lucide-react";
import { useCallback, useRef } from "react";
import ImageCard from "../../card/image-card";
import ImageUploader from "../../image-uploader";

export default function ImagesTab() {
	const { template, addImage, activeElement, setActiveElement, setTemplate } =
		useTemplateContext();

	const { handleBackgroundChange, removeBackground } =
		useBackgroundCanvas(setTemplate);

	const backgroundImageRef = useRef<HTMLInputElement>(null);

	return (
		<div className="space-y-4 pt-4">
			{/* Background Image Section */}
			<div className="space-y-2">
				<h3 className="text-sm font-medium text-gray-700">Background</h3>
				{template.backgroundImage ? (
					<ImageUploader
						image={{
							id: "background",
							src: template.backgroundImage,
							type: "image",
							position: { x: 0, y: 0 },
							width: 0,
							height: 0,
							zIndex: 0,
							draggable: false,
						}}
						onChange={handleBackgroundChange}
						onDelete={removeBackground}
					/>
				) : (
					<Button
						variant="outline"
						className="w-full"
						onClick={() => {
							backgroundImageRef.current?.click();
						}}
					>
						<ImagePlus className="h-4 w-4 mr-2" />
						Upload Background
						<input
							id="upload-background"
							ref={backgroundImageRef}
							type="file"
							accept="image/*"
							className="hidden"
							onChange={(e) => {
								if (e.target.files?.[0])
									handleBackgroundChange(e.target.files[0]);
							}}
						/>
					</Button>
				)}
			</div>

			{/* Separator */}
			<div className="border-t border-gray-200" />

			{/* Regular Images Section */}
			<div className="space-y-2">
				<h3 className="text-sm font-medium text-gray-700">Images</h3>
				<Button onClick={addImage} className="w-full">
					<ImagePlus className="mr-2 h-4 w-4" />
					Add Image
				</Button>
			</div>

			<div className="space-y-3">
				{template.images.map((img) => (
					<ImageCard
						key={img.id}
						img={img}
						selected={activeElement === img.id}
						onSelect={() => setActiveElement(img.id)}
					/>
				))}

				{template.images.length === 0 && (
					<p className="text-center text-sm text-gray-500">
						No images added yet
					</p>
				)}
			</div>
		</div>
	);
}
