"use client";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import type { ImageElement } from "@/shared/types/template";
import { useTemplateContext } from "../../containers/template-creator";

interface Props {
	img: ImageElement;
	selected: boolean;
	onSelect: () => void;
}

export default function ImageCard({ img, selected, onSelect }: Props) {
	const { updateImage } = useTemplateContext();
	const inputId = `file-${img.id}`;

	return (
		<Card
			className={`overflow-hidden cursor-pointer ${selected ? "ring-2 ring-primary" : ""}`}
			onClick={onSelect}
		>
			<CardContent className="p-2">
				<div className="flex items-center gap-2">
					<div className="h-16 w-16 overflow-hidden rounded border">
						<img
							src={img.src || "/placeholder.svg"}
							alt=""
							className="h-full w-full object-cover"
						/>
					</div>

					<div className="flex-1">
						<p className="text-xs font-medium">Image</p>
						<p className="text-xs text-gray-500">
							{Math.round(img.width)}×{Math.round(img.height)}px
						</p>

						<input
							id={inputId}
							type="file"
							accept="image/*"
							hidden
							onChange={(e) => {
								const file = e.target.files?.[0];
								if (!file) return;
								const reader = new FileReader();
								reader.onload = (ev) =>
									updateImage(img.id, { src: ev.target?.result as string });
								reader.readAsDataURL(file);
							}}
						/>
						<Button
							variant="ghost"
							size="sm"
							className="h-7 mt-1 text-xs"
							onClick={(e) => {
								e.stopPropagation();
								document.getElementById(inputId)?.click();
							}}
						>
							Replace
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
