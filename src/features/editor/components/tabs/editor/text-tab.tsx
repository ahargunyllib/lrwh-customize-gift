"use client";
import TextEditor from "@/features/editor/components/text-editor";
import { useTemplateContext } from "@/features/editor/containers/template-editor";

export default function TextTab() {
	const { template, activeElement, setActiveElement, updateText } =
		useTemplateContext();

	return (
		<div className="space-y-4 pt-4">
			<h3 className="font-medium">Edit Text</h3>
			<div className="space-y-3">
				{template.texts.map((txt) => (
					<TextEditor
						key={txt.id}
						text={txt}
						isActive={activeElement === txt.id}
						onChange={(v) => updateText(txt.id, { content: v })}
						onStyleChange={(prop, val) =>
							updateText(txt.id, {
								style: { ...txt.style, [prop]: val },
							})
						}
						onSelect={() => setActiveElement(txt.id)}
					/>
				))}
			</div>

			<div className="mt-2 p-3 border border-dashed rounded-md bg-white">
				<p className="text-xs text-center text-gray-400">
					Double-click any text on the canvas to edit it directly
				</p>
			</div>
		</div>
	);
}
