"use client";
import TextEditor from "@/features/editor/components/text-editor";
import { useTemplateContext } from "@/features/editor/containers/template-editor";

export default function TextTab() {
	const { template, activeElement, setActiveElement, updateText } =
		useTemplateContext();
	return (
		<div className="space-y-4 pt-4">
			<div>
				<h3 className="font-medium">Ubah teks</h3>
				<p className="text-sm text-gray-500">
					Sesuaikan teks dalam template Anda di sini.
				</p>
			</div>
			<div className="space-y-3">
				{template.texts.map((txt) => (
					<TextEditor
						key={txt.id}
						text={txt}
						isActive={activeElement?.id === txt.id}
						onChange={(v) => updateText(txt.id, { content: v })}
						onStyleChange={(prop, val) =>
							updateText(txt.id, {
								style: { ...txt.style, [prop]: val },
							})
						}
						onSelect={() => setActiveElement({ id: txt.id, type: "text" })}
					/>
				))}
			</div>

			<div className="mt-2 p-3 border border-dashed rounded-md bg-white">
				<p className="text-xs text-center text-gray-400">
					Klik pada teks di kanvas untuk mengeditnya.
				</p>
			</div>
		</div>
	);
}
