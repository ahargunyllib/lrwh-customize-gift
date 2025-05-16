"use client";
import ImageUploader from "@/features/editor/components/image-uploader";
import { useTemplateContext } from "@/features/editor/containers/template-editor";

export default function ImagesTab() {
	const { template, updateImage } = useTemplateContext();
	const handleReplace = (img: { id: string }, file: File) => {
		const reader = new FileReader();
		reader.onload = (ev) =>
			updateImage(img.id, { src: ev.target?.result as string });
		reader.readAsDataURL(file);
	};

	return (
		<div className="space-y-4 pt-4">
			<h3 className="font-medium">Replace Images</h3>
			<div className="space-y-3">
				{template.images.map((img) => (
					<ImageUploader
						key={img.id}
						image={img}
						onChange={(file) => handleReplace(img, file)}
					/>
				))}
			</div>

			<div className="mt-6 p-3 border border-dashed rounded-md bg-white">
				<p className="text-sm text-center text-gray-500 mb-2">
					Drag &amp; Drop Images
				</p>
				<p className="text-xs text-center text-gray-400">
					Drag an image directly onto any image in the template to replace it
				</p>
			</div>
		</div>
	);
}
