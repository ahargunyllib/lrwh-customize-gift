"use client";

import type React from "react";

import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { fontArray } from "@/shared/lib/font";
import { cn } from "@/shared/lib/utils";
import type { TextElement } from "@/shared/types/template";
import { useState } from "react";

interface TextEditorProps {
	text: TextElement;
	isActive: boolean;
	onChange: (value: string) => void;
	onStyleChange: (property: string, value: string) => void;
	onSelect: () => void;
}

export default function TextEditor({
	text,
	isActive,
	onChange,
	onStyleChange,
	onSelect,
}: TextEditorProps) {
	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onChange(e.target.value);
	};

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
		<div
			className={`p-3 border rounded-md ${isActive ? "border-primary bg-primary/5" : "border-gray-200"}`}
			onClick={onSelect}
		>
			<div className="space-y-3">
				{/* Min max validation error */}
				<div>
					<Label className="text-xs mb-1 block">Konten Teks</Label>
					<Textarea
						value={text.content}
						onChange={(e) => {
							handleInputChange(e);
						}}
						className={cn("resize-none")}
						rows={2}
						maxLength={text.textLimit}
					/>
				</div>

				{isActive && (
					<div className="flex flex-col gap-2">
						<div className="space-y-1">
							<Label htmlFor={`font-${text.id}`} className="text-xs">
								Jenis Font
							</Label>
							<Select
								value={
									fontArray.find(
										(f) =>
											f.fontfamily.replace(/['"]/g, "") ===
											text.style.fontFamily.replace(/['"]/g, ""),
									)?.fontname || ""
								}
								onValueChange={(value) => {
									const selectedFont = fontArray.find(
										(f) => f.fontname === value,
									)?.fontfamily;
									if (selectedFont) {
										onStyleChange("fontFamily", selectedFont);
									}
								}}
							>
								<SelectTrigger id={`font-${text.id}`} className="h-8">
									<SelectValue placeholder="Jenis Font" />
								</SelectTrigger>
								<SelectContent>
									{fontArray.map((font) => (
										<SelectItem key={font.fontname} value={font.fontname}>
											<span
												className="text-sm"
												style={{
													fontFamily: font.fontfamily,
												}}
											>
												{font.fontname}
											</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1">
							<Label htmlFor={`size-${text.id}`} className="text-xs">
								Ukuran
							</Label>
							<Input
								id={`size-${text.id}`}
								type="number"
								value={
									typeof text.style.fontSize === "string"
										? text.style.fontSize.replace("px", "")
										: text.style.fontSize
								}
								onChange={(e) =>
									onStyleChange("fontSize", `${e.target.value}px`)
								}
								className="h-8"
							/>
						</div>

						<div className="space-y-1">
							<Label htmlFor={`color-${text.id}`} className="text-xs">
								Warna
							</Label>
							<div className="flex h-8 items-center gap-2">
								<input
									type="color"
									value={text.style.color}
									onChange={(e) => onStyleChange("color", e.target.value)}
									className="w-8 h-8 rounded border p-0"
								/>
								<Input
									value={text.style.color}
									onChange={(e) => onStyleChange("color", e.target.value)}
									className="h-8 flex-1"
								/>
							</div>
						</div>

						<div className="space-y-1">
							<Label htmlFor={`align-${text.id}`} className="text-xs">
								Penyelarasan
							</Label>
							<Select
								value={text.style.textAlign}
								onValueChange={(value) => onStyleChange("textAlign", value)}
							>
								<SelectTrigger id={`align-${text.id}`} className="h-8">
									<SelectValue placeholder="Align" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="left">Kiri</SelectItem>
									<SelectItem value="center">Tengah</SelectItem>
									<SelectItem value="right">Kanan</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{text.textLimit !== undefined && (
							<div className="space-y-1">
								<Label htmlFor={`limit-${text.id}`} className="text-xs">
									Limit Karakter
								</Label>
								<Input
									id={`limit-${text.id}`}
									type="number"
									value={text.textLimit}
									onChange={(e) => onStyleChange("textLimit", e.target.value)}
									className="h-8"
									disabled
								/>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
