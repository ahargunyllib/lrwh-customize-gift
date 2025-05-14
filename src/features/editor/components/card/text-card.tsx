"use client";
import { Card, CardContent } from "@/shared/components/ui/card";
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
import type { TextElement } from "@/shared/types/template";
import { useTemplateContext } from "../../containers/template-creator";

interface Props {
	txt: TextElement;
	selected: boolean;
	onSelect: () => void;
}

export default function TextCard({ txt, selected, onSelect }: Props) {
	const { updateText } = useTemplateContext();

	return (
		<Card
			className={`cursor-pointer ${selected ? "ring-2 ring-primary" : ""}`}
			onClick={onSelect}
		>
			<CardContent className="p-3 space-y-2">
				{/* Content */}
				<Textarea
					rows={2}
					value={txt.content}
					className="resize-none"
					onChange={(e) => updateText(txt.id, { content: e.target.value })}
					onClick={(e) => e.stopPropagation()}
				/>

				{/* Font family & size */}
				<div className="grid grid-cols-2 gap-2">
					<div className="space-y-0.5">
						<Label className="text-xs">Font</Label>
						<Select
							value={txt.style.fontFamily}
							onValueChange={(v) =>
								updateText(txt.id, {
									style: { ...txt.style, fontFamily: v },
								})
							}
						>
							<SelectTrigger className="h-8">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{[
									"Arial, sans-serif",
									"'Times New Roman', serif",
									"'Courier New', monospace",
									"Georgia, serif",
								].map((f) => (
									<SelectItem key={f} value={f}>
										{f.split(",")[0].replace(/'/g, "")}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-0.5">
						<Label className="text-xs">Size</Label>
						<Select
							value={txt.style.fontSize}
							onValueChange={(v) =>
								updateText(txt.id, {
									style: { ...txt.style, fontSize: v },
								})
							}
						>
							<SelectTrigger className="h-8">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{["12px", "14px", "16px", "18px", "24px", "32px", "48px"].map(
									(s) => (
										<SelectItem key={s} value={s}>
											{s}
										</SelectItem>
									),
								)}
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Color */}
				<div className="space-y-0.5">
					<Label className="text-xs">Color</Label>
					<div className="flex items-center gap-2">
						<input
							type="color"
							value={txt.style.color}
							className="w-8 h-8 border rounded"
							onChange={(e) =>
								updateText(txt.id, {
									style: { ...txt.style, color: e.target.value },
								})
							}
							onClick={(e) => e.stopPropagation()}
						/>
						<Input
							value={txt.style.color}
							onChange={(e) =>
								updateText(txt.id, {
									style: { ...txt.style, color: e.target.value },
								})
							}
							className="h-8"
							onClick={(e) => e.stopPropagation()}
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
