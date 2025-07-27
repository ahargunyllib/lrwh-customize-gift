"use client";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import type { ImageElement } from "@/shared/types/template";
import { useTemplateContext } from "../../containers/template-creator";

import {
	ArrowDown,
	ArrowDownToLine,
	ArrowUp,
	ArrowUpToLine,
} from "lucide-react";

interface Props {
	img: ImageElement;
	selected: boolean;
	onSelect: () => void;
}

export default function ImageCard({ img, selected, onSelect }: Props) {
	const {
		updateImage,
		deleteElement,
		bringForward,
		sendBackward,
		bringToFront,
		sendToBack,
	} = useTemplateContext();

	const inputId = `file-${img.id}`;

	return (
		<Card
			className={`overflow-hidden cursor-pointer ${selected ? "ring-2 ring-primary" : ""}`}
			onClick={onSelect}
		>
			<CardContent className="p-2">
				<div className="flex items-start gap-2">
					<div
						className="h-16 w-16 overflow-hidden border"
						style={{
							borderRadius: img.borderRadius ?? 0,
							filter: img.grayscale ? "grayscale(1)" : "none",
						}}
					>
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

						{/* Replace/Delete */}
						<div className="flex gap-2 mt-2">
							<Button
								variant="ghost"
								size="sm"
								className="h-7 text-xs"
								onClick={(e) => {
									e.stopPropagation();
									document.getElementById(inputId)?.click();
								}}
							>
								Replace
							</Button>
							<Button
								variant="destructive"
								size="sm"
								className="h-7 text-xs"
								onClick={(e) => {
									e.stopPropagation();
									deleteElement(img.id);
								}}
							>
								Delete
							</Button>
						</div>

						{/* Layer Z-Index Control */}
						<div className="flex flex-wrap gap-2 mt-2">
							<Button
								variant="outline"
								size="sm"
								className="h-7 text-xs"
								onClick={(e) => {
									e.stopPropagation();
									bringForward(img.id);
								}}
							>
								<ArrowUp className="w-4 h-4 mr-1" />
								Forward
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="h-7 text-xs"
								onClick={(e) => {
									e.stopPropagation();
									sendBackward(img.id);
								}}
							>
								<ArrowDown className="w-4 h-4 mr-1" />
								Backward
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="h-7 text-xs"
								onClick={(e) => {
									e.stopPropagation();
									bringToFront(img.id);
								}}
							>
								<ArrowUpToLine className="w-4 h-4 mr-1" />
								To Front
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="h-7 text-xs"
								onClick={(e) => {
									e.stopPropagation();
									sendToBack(img.id);
								}}
							>
								<ArrowDownToLine className="w-4 h-4 mr-1" />
								To Back
							</Button>
						</div>

						{/* Control Panel */}
						<div className="mt-2 space-y-1">
							<div className="flex gap-1 items-center">
								<Label className="text-xs w-20">Width</Label>
								<Input
									type="number"
									min={1}
									className="h-7 px-2 text-xs"
									value={img.width}
									onChange={(e) =>
										updateImage(img.id, {
											width: Math.max(1, Number(e.target.value)),
										})
									}
								/>
							</div>
							<div className="flex gap-1 items-center">
								<Label className="text-xs w-20">Height</Label>
								<Input
									type="number"
									min={1}
									className="h-7 px-2 text-xs"
									value={img.height}
									onChange={(e) =>
										updateImage(img.id, {
											height: Math.max(1, Number(e.target.value)),
										})
									}
								/>
							</div>
							<div className="flex gap-1 items-center">
								<Label className="text-xs w-20">Radius</Label>
								<Input
									type="number"
									min={0}
									className="h-7 px-2 text-xs"
									value={img.borderRadius ?? 0}
									onChange={(e) =>
										updateImage(img.id, {
											borderRadius: Math.max(0, Number(e.target.value)),
										})
									}
								/>
							</div>
							<div className="flex items-center gap-2 mt-1">
								<Switch
									checked={img.grayscale ?? false}
									onCheckedChange={(val) =>
										updateImage(img.id, { grayscale: val })
									}
									id={`grayscale-${img.id}`}
								/>
								<Label htmlFor={`grayscale-${img.id}`} className="text-xs">
									Grayscale
								</Label>
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
