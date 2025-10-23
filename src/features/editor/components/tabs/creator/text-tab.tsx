"use client";
import { useTemplateContext } from "@/features/editor/containers/template-creator";
import { Button } from "@/shared/components/ui/button";
import { useScrollToActive } from "@/shared/hooks/use-scroll-to-active";
import { Type } from "lucide-react";
import { useMemo } from "react";
import TextCard from "../../card/text-card";

export default function TextTab() {
	const { template, addText, activeElement, setActiveElement } =
		useTemplateContext();

	const activeTextId = useMemo(
		() => (activeElement?.type === "text" ? activeElement.id : undefined),
		[activeElement],
	);

	const { getRef } = useScrollToActive({
		activeId: activeTextId,
		deps: [template.texts.length],
	});

	return (
		<div className="space-y-4 pt-4">
			<Button onClick={addText} className="w-full">
				<Type className="mr-2 h-4 w-4" />
				Add Text
			</Button>

			<div className="space-y-3">
				{template.texts.map((t) => (
					<div key={t.id} ref={getRef(t.id)}>
						<TextCard
							txt={t}
							selected={activeElement?.id === t.id}
							onSelect={() => setActiveElement({ id: t.id, type: "text" })}
						/>
					</div>
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
