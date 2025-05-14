"use client";
import { useTemplateContext } from "@/features/editor/containers/template-creator";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { printSizes } from "@/shared/lib/template";
import { Trash2 } from "lucide-react";
import { Fragment } from "react";
import ElementControls from "../../template-elements/element-controls";

export default function SettingsTab() {
	const {
		template,
		setTemplate,
		activeElement,
		deleteElement,
		changePrintSize,
		setActiveElement,
	} = useTemplateContext();

	return (
		<div className="space-y-4 pt-4">
			{/* Template name */}
			<div className="space-y-1.5">
				<Label>Template Name</Label>
				<Input
					value={template.name}
					onChange={(e) => setTemplate((p) => ({ ...p, name: e.target.value }))}
				/>
			</div>

			{/* Print size */}
			<div className="space-y-1.5">
				<Label>Print Size</Label>
				<Select
					value={
						printSizes.find(
							(s) => s.width === template.width && s.height === template.height,
						)?.name
					}
					onValueChange={changePrintSize}
				>
					<SelectTrigger>
						<SelectValue placeholder="Size" />
					</SelectTrigger>
					<SelectContent>
						{printSizes.map((s) => (
							<SelectItem key={s.name} value={s.name}>
								{s.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Background */}
			<div className="space-y-1.5">
				<Label>Background Color</Label>
				<Input
					type="color"
					value={template.backgroundColor}
					onChange={(e) =>
						setTemplate((p) => ({ ...p, backgroundColor: e.target.value }))
					}
					className="w-12 h-12 p-0 border rounded"
				/>
			</div>

			{/* Quick tools */}
			{activeElement && (
				<Fragment>
					<div className="pt-3">
						<Label className="text-sm">Quick Alignment</Label>
						<ElementControls
							onCenterX={() =>
								document.dispatchEvent(
									new CustomEvent("elementCenter", {
										detail: { id: activeElement, axis: "x" },
									}),
								)
							}
							onCenterY={() =>
								document.dispatchEvent(
									new CustomEvent("elementCenter", {
										detail: { id: activeElement, axis: "y" },
									}),
								)
							}
							onCenterBoth={() =>
								document.dispatchEvent(
									new CustomEvent("elementCenter", {
										detail: { id: activeElement, axis: "both" },
									}),
								)
							}
						/>
					</div>

					<Button
						variant="destructive"
						size="sm"
						onClick={() => {
							deleteElement(activeElement);
							setActiveElement(null);
						}}
						className="w-full"
					>
						<Trash2 className="mr-2 h-4 w-4" />
						Delete Selected
					</Button>
				</Fragment>
			)}
		</div>
	);
}
