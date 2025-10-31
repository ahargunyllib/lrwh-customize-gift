"use client";

import { Button } from "@/shared/components/ui/button";
import type { ImageElement } from "@/shared/types/template";
import { Upload, X } from "lucide-react";
import type React from "react";
import { useState } from "react";

interface ImageUploaderProps {
	image: ImageElement;
	onChange: (file: File) => void;
	onDelete?: () => void;
}

export default function ImageUploader({
	image,
	onChange,
	onDelete,
}: ImageUploaderProps) {
	const [isDragging, setIsDragging] = useState(false);

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = () => {
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);

		if (e.dataTransfer.files?.[0]) {
			const file = e.dataTransfer.files[0];
			if (file.type.startsWith("image/")) {
				onChange(file);
			}
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files?.[0]) {
			onChange(e.target.files[0]);
		}
	};

	return (
		<div className="space-y-2">
			<div
				className={`relative border rounded-md overflow-hidden ${
					isDragging
						? "border-primary border-dashed bg-primary/5"
						: "border-gray-200"
				}`}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
			>
				<img
					src={image.src || "https://placecats.com/300/200"}
					// biome-ignore lint/a11y/noRedundantAlt: <explanation>
					alt="Template image"
					className="w-full h-full object-cover"
					style={{
						filter: image.grayscalePercent
							? `grayscale(${image.grayscalePercent}%)`
							: "none",
					}}
				/>
				<div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
					<Button
						variant="secondary"
						size="sm"
						onClick={() => document.getElementById(`file-${image.id}`)?.click()}
					>
						<Upload className="h-4 w-4 mr-1" />
						Ganti Gambar
					</Button>
					{onDelete && (
						<Button
							variant="destructive"
							size="sm"
							onClick={onDelete}
							className="px-2"
						>
							<X className="h-4 w-4" />
						</Button>
					)}
				</div>
			</div>
			<input
				id={`file-${image.id}`}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={handleFileChange}
			/>
		</div>
	);
}
