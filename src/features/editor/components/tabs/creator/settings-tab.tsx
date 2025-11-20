"use client";
import { useTemplateContext } from "@/features/editor/containers/template-creator";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { triggerElementCenter } from "@/shared/lib/events";
import { Trash2 } from "lucide-react";
import { Fragment } from "react";
import ProductVariantSelectContainer from "../../../containers/product-variant-select-container";
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

			<div className="space-y-1.5">
				<Label>Product Variant</Label>
				<ProductVariantSelectContainer
					value={template.productVariantId}
					onValueChange={(value, width, height) => {
						setTemplate((p) => ({
							...p,
							productVariantId: value,
							width: width * 40,
							height: height * 40,
						}));
						changePrintSize(width, height);
					}}
				/>
			</div>

			<div className="space-y-1.5">
				<Label>Preview Image</Label>
				<Input
					type="file"
          accept="image/*"
					onChange={(e) =>
						setTemplate((p) => ({ ...p, previewFile: e.target.files?.[0] || null }))
					}
				/>
			</div>

			{/* Print size */}
			{/* <div className="space-y-1.5">
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
			</div> */}

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
							onCenterX={() => triggerElementCenter(activeElement.id, "x")}
							onCenterY={() => triggerElementCenter(activeElement.id, "y")}
							onCenterBoth={() =>
								triggerElementCenter(activeElement.id, "both")
							}
						/>
					</div>

					<Button
						variant="destructive"
						size="sm"
						onClick={() => {
							deleteElement(activeElement.id);
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
