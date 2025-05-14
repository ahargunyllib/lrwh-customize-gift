"use client";
import { useTemplateContext } from "@/features/editor/containers/template-creator";
import { Button } from "@/shared/components/ui/button";
import { ImagePlus } from "lucide-react";
import ImageCard from "../../card/image-card";

export default function ImagesTab() {
	const { template, addImage, activeElement, setActiveElement } =
		useTemplateContext();

	return (
		<div className="space-y-4 pt-4">
			<Button onClick={addImage} className="w-full">
				<ImagePlus className="mr-2 h-4 w-4" />
				Add Image
			</Button>

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
