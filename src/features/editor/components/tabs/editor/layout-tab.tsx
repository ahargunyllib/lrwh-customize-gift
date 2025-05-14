"use client";

import { useTemplateContext } from "@/features/editor/containers/template-editor";

export default function LayoutTab() {
	const { selectedSize } = useTemplateContext();
	return (
		<div className="space-y-4 pt-4">
			<h3 className="font-medium">Template Layout</h3>
			<div className="space-y-2">
				<div className="flex justify-between text-sm">
					<span>Current Size:</span>
					<span className="font-medium">{selectedSize.label}</span>
				</div>
				<div className="flex justify-between text-sm">
					<span>Dimensions:</span>
					<span className="font-medium">
						{selectedSize.width}×{selectedSize.height}px
					</span>
				</div>
			</div>
			<p className="mt-4 text-sm text-gray-500">
				This template has a fixed layout. You can replace images and edit text,
				but component positions are locked.
			</p>
		</div>
	);
}
