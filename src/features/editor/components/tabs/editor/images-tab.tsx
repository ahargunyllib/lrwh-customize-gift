"use client";
import ImageUploader from "@/features/editor/components/image-uploader";
import { useTemplateContext } from "@/features/editor/containers/template-editor";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Slider } from "../../../../../shared/components/ui/slider";

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
			<div>
				<h3 className="font-medium">Gambar</h3>
				<p className="text-sm text-gray-500">
					Sesuaikan gambar-gambar dalam template Anda di sini.
				</p>
			</div>
			<div className="space-y-3">
				{template.images.map((img) => (
					<div key={img.id}>
						<ImageUploader
							image={img}
							onChange={(file) => handleReplace(img, file)}
						/>
						<div className="flex items-center gap-2 mt-1">
							<Label className="text-xs w-20">Hitam Putih</Label>
							<Slider
								min={0}
								max={100}
								step={1}
								value={[img.grayscalePercent ?? 0]}
								onValueChange={(value) =>
									updateImage(img.id, {
										grayscalePercent: value[0],
									})
								}
								className="flex-1"
							/>
							<span className="text-xs text-gray-500 min-w-[35px]">
								{img.grayscalePercent ?? 0}%
							</span>
						</div>
					</div>
				))}
			</div>

			<div className="mt-6 p-3 border border-dashed rounded-md bg-white">
				<p className="text-sm text-center text-gray-500 mb-2">
					Tarik &amp; Jatuhkan Gambar
				</p>
				<p className="text-xs text-center text-gray-400">
					Jatuhkan gambar langsung ke gambar mana pun dalam template untuk
					menggantinya
				</p>
			</div>
		</div>
	);
}
