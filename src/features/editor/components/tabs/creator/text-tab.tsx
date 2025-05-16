"use client";
import { useTemplateContext } from "@/features/editor/containers/template-creator";
import { Button } from "@/shared/components/ui/button";
import { Type } from "lucide-react";
import TextCard from "../../card/text-card";

export default function TextTab() {
	const { template, addText, activeElement, setActiveElement } =
		useTemplateContext();

	return (
		<div className="space-y-4 pt-4">
			<Button onClick={addText} className="w-full">
				<Type className="mr-2 h-4 w-4" />
				Add Text
			</Button>

			<div className="space-y-3">
				{template.texts.map((t) => (
					<TextCard
						key={t.id}
						txt={t}
						selected={activeElement === t.id}
						onSelect={() => setActiveElement(t.id)}
					/>
				))}

				{template.texts.length === 0 && (
					<p className="text-center text-sm text-gray-500">
						No text elements added yet
					</p>
				)}
			</div>
		</div>
	);
}
