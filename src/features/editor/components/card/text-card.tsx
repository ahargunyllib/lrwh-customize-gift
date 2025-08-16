"use client";
import { Button } from "@/shared/components/ui/button";
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
import { Slider } from "@/shared/components/ui/slider";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@/shared/components/ui/toggle-group";
import { fontArray } from "@/shared/lib/font";
import { cn } from "@/shared/lib/utils";
import type { TextElement } from "@/shared/types/template";
import {
	AlignCenter,
	AlignJustify,
	AlignLeft,
	AlignRight,
	ArrowDown,
	ArrowDownToLine,
	ArrowUp,
	ArrowUpToLine,
} from "lucide-react";
import { useTemplateContext } from "../../containers/template-creator";

interface Props {
	txt: TextElement;
	selected: boolean;
	onSelect: () => void;
}

export default function TextCard({ txt, selected, onSelect }: Props) {
	const {
		updateText,
		deleteElement,
		bringForward,
		bringToFront,
		sendBackward,
		sendToBack,
	} = useTemplateContext();

	return (
		<Card
			className={cn("cursor-pointer", selected && "ring-2 ring-primary")}
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
				<div className="grid grid-cols-2 gap-2 col-span-2">
					{/* Font */}
					<div className="space-y-0.5 col-span-2 w-full">
						<Label className="text-xs">Font</Label>
						<Select
							value={txt.style.fontFamily}
							onValueChange={(value) =>
								updateText(txt.id, {
									style: { ...txt.style, fontFamily: value },
								})
							}
						>
							<SelectTrigger className="h-8 w-full">
								<SelectValue placeholder="Select font" />
							</SelectTrigger>
							<SelectContent>
								{fontArray.map((font) => (
									<SelectItem key={font.fontname} value={font.fontfamily}>
										<span
											className="text-xl"
											style={{
												fontFamily: font.fontfamily,
											}}
										>
											{font.fontname}
										</span>{" "}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Size */}
					<div className="space-y-0.5">
						<Label className="text-xs">Size</Label>
						<Input
							type="number"
							min={1}
							value={Math.max(
								1,
								Number.parseInt(
									typeof txt.style.fontSize === "string"
										? txt.style.fontSize.replace("px", "")
										: String(txt.style.fontSize),
								),
							)}
							onChange={(e) =>
								updateText(txt.id, {
									style: {
										...txt.style,
										fontSize: `${Math.max(1, Number.parseInt(e.target.value))}px`,
									},
								})
							}
							className="h-8"
							onClick={(e) => e.stopPropagation()}
						/>
					</div>
				</div>

				{/* Color */}
				<div className="space-y-0.5 col-span-2">
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

				{/* Text Outline Settings */}
				<div className="space-y-2 col-span-2 border-t pt-2">
					<Label className="text-sm font-medium">Text Outline</Label>

					{/* Enable Outline */}
					<div className="flex items-center justify-between">
						<Label className="text-xs">Enable Outline</Label>
						<Switch
							checked={
								txt.style.textStroke !== undefined &&
								txt.style.textStroke !== "none"
							}
							onCheckedChange={(checked) =>
								updateText(txt.id, {
									style: {
										...txt.style,
										textStroke: checked
											? `${txt.style.outlineWidth || 1}px ${txt.style.outlineColor || "#000000"}`
											: "none",
										WebkitTextStroke: checked
											? `${txt.style.outlineWidth || 1}px ${txt.style.outlineColor || "#000000"}`
											: "none",
									},
								})
							}
						/>
					</div>

					{/* Outline Width */}
					{txt.style.textStroke !== "none" && txt.style.textStroke && (
						<>
							<div className="space-y-0.5">
								<Label className="text-xs">Outline Width</Label>
								<Input
									type="number"
									min={0}
									max={10}
									step={0.5}
									value={txt.style.outlineWidth || 1}
									onChange={(e) => {
										const width = Math.max(
											0,
											Number.parseFloat(e.target.value),
										);
										const color = txt.style.outlineColor || "#000000";
										updateText(txt.id, {
											style: {
												...txt.style,
												outlineWidth: width,
												textStroke: `${width}px ${color}`,
												WebkitTextStroke: `${width}px ${color}`,
											},
										});
									}}
									className="h-8"
									onClick={(e) => e.stopPropagation()}
								/>
							</div>

							{/* Outline Color */}
							<div className="space-y-0.5">
								<Label className="text-xs">Outline Color</Label>
								<div className="flex items-center gap-2">
									<input
										type="color"
										value={txt.style.outlineColor || "#000000"}
										className="w-8 h-8 border rounded"
										onChange={(e) => {
											const color = e.target.value;
											const width = txt.style.outlineWidth || 1;
											updateText(txt.id, {
												style: {
													...txt.style,
													outlineColor: color,
													textStroke: `${width}px ${color}`,
													WebkitTextStroke: `${width}px ${color}`,
												},
											});
										}}
										onClick={(e) => e.stopPropagation()}
									/>
									<Input
										value={txt.style.outlineColor || "#000000"}
										onChange={(e) => {
											const color = e.target.value;
											const width = txt.style.outlineWidth || 1;
											updateText(txt.id, {
												style: {
													...txt.style,
													outlineColor: color,
													textStroke: `${width}px ${color}`,
													WebkitTextStroke: `${width}px ${color}`,
												},
											});
										}}
										className="h-8"
										onClick={(e) => e.stopPropagation()}
									/>
								</div>
							</div>
						</>
					)}
				</div>

				{/* Letter Spacing */}
				<div className="space-y-0.5 col-span-2">
					<Label className="text-xs">Letter Spacing</Label>
					<Input
						type="number"
						step={0.1}
						min={0}
						value={txt.style.letterSpacing ?? 0}
						onChange={(e) =>
							updateText(txt.id, {
								style: {
									...txt.style,
									letterSpacing: Math.max(0, Number.parseFloat(e.target.value)),
								},
							})
						}
						onClick={(e) => e.stopPropagation()}
						className="h-8"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<div className="flex gap-1 items-center">
						<Label className="text-xs w-20">Rotate</Label>
						<Input
							type="number"
							className="h-7 px-2 text-xs"
							value={txt.rotate ?? 0}
							onChange={(e) =>
								updateText(txt.id, {
									rotate: Number(e.target.value),
								})
							}
						/>
					</div>
					{/* Slider untuk Rotate */}
					<Slider
						value={[txt.rotate ?? 0]}
						min={-180}
						max={180}
						step={1}
						onValueChange={([val]) => updateText(txt.id, { rotate: val })}
					/>
				</div>
				{/* Curve Settings */}
				<div className="space-y-2 col-span-2 border-t pt-2">
					<Label className="text-sm font-medium">Curve Text</Label>

					{/* Enable Curve */}
					<div className="flex items-center justify-between">
						<Label className="text-xs">Enable Curve</Label>
						<Switch
							checked={txt.style.curved || false}
							onCheckedChange={(checked) =>
								updateText(txt.id, {
									style: {
										...txt.style,
										curved: checked,
									},
								})
							}
						/>
					</div>

					{/* Curve Settings - only show when curve is enabled */}
					{txt.style.curved && (
						<>
							<div className="space-y-0.5">
								<Label className="text-xs">Curve Radius</Label>
								<Input
									type="number"
									min={50}
									max={1000}
									value={txt.style.curveRadius ?? 200}
									onChange={(e) =>
										updateText(txt.id, {
											style: {
												...txt.style,
												curveRadius: Math.max(
													50,
													Number.parseInt(e.target.value),
												),
											},
										})
									}
									onClick={(e) => e.stopPropagation()}
									className="h-8"
								/>
							</div>

							<div className="space-y-0.5">
								<Label className="text-xs">Curve Direction</Label>
								<Select
									value={txt.style.curveDirection ?? "up"}
									onValueChange={(value) =>
										updateText(txt.id, {
											style: {
												...txt.style,
												curveDirection: value as "up" | "down",
											},
										})
									}
								>
									<SelectTrigger className="h-8 w-full">
										<SelectValue placeholder="Curve Direction" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="up">Curve Up</SelectItem>
										<SelectItem value="down">Curve Down</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-0.5">
								<Label className="text-xs">Curve Intensity</Label>
								<Input
									type="number"
									min={0.1}
									max={2}
									step={0.1}
									value={txt.style.curveIntensity ?? 1}
									onChange={(e) =>
										updateText(txt.id, {
											style: {
												...txt.style,
												curveIntensity: Math.max(
													0.1,
													Number.parseFloat(e.target.value),
												),
											},
										})
									}
									onClick={(e) => e.stopPropagation()}
									className="h-8"
								/>
							</div>
						</>
					)}
				</div>

				{/* Centering */}
				<div className="grid grid-cols-2 gap-2 mt-2">
					<div className="flex items-center gap-2">
						<Label className="text-xs">Center X</Label>
						<Switch
							checked={txt.style.centerX}
							onCheckedChange={(val) =>
								updateText(txt.id, {
									style: { ...txt.style, centerX: val },
								})
							}
						/>
					</div>
					<div className="flex items-center gap-2">
						<Label className="text-xs">Center Y</Label>
						<Switch
							checked={txt.style.centerY}
							onCheckedChange={(val) =>
								updateText(txt.id, {
									style: { ...txt.style, centerY: val },
								})
							}
						/>
					</div>
				</div>

				{/* Editable (Draggable false) */}
				<div className="flex items-center justify-between pt-1">
					<Label className="text-xs">Fix Position</Label>
					<Switch
						checked={txt.draggable === false}
						onCheckedChange={(value) =>
							updateText(txt.id, {
								draggable: !value,
							})
						}
					/>
				</div>

				{/* Text Align */}
				<div className="space-y-0.5 col-span-2">
					<Label className="text-xs">Text Align</Label>
					<ToggleGroup
						type="single"
						value={txt.style.textAlign ?? "left"}
						onValueChange={(value) =>
							value &&
							updateText(txt.id, {
								style: {
									...txt.style,
									textAlign: value as "left" | "center" | "right" | "justify",
								},
							})
						}
						className="grid grid-cols-4 gap-1"
					>
						<ToggleGroupItem value="left" className="p-2">
							<AlignLeft className="w-4 h-4" />
						</ToggleGroupItem>
						<ToggleGroupItem value="center" className="p-2">
							<AlignCenter className="w-4 h-4" />
						</ToggleGroupItem>
						<ToggleGroupItem value="right" className="p-2">
							<AlignRight className="w-4 h-4" />
						</ToggleGroupItem>
						<ToggleGroupItem value="justify" className="p-2">
							<AlignJustify className="w-4 h-4" />
						</ToggleGroupItem>
					</ToggleGroup>
				</div>

				{/* Layer Z-Index Control */}
				<div className="flex flex-wrap gap-2 mt-2">
					<Button
						variant="outline"
						size="sm"
						className="h-7 text-xs"
						onClick={(e) => {
							e.stopPropagation();
							bringForward(txt.id);
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
							sendBackward(txt.id);
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
							bringToFront(txt.id);
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
							sendToBack(txt.id);
						}}
					>
						<ArrowDownToLine className="w-4 h-4 mr-1" />
						To Back
					</Button>
				</div>

				<Button
					variant="destructive"
					size="sm"
					className="h-7 mt-1 text-xs"
					onClick={(e) => {
						deleteElement(txt.id);
					}}
				>
					Delete
				</Button>
			</CardContent>
		</Card>
	);
}
