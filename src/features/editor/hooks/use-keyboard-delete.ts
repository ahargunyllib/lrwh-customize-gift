"use client";
import type { ActiveElement } from "@/shared/types/element";
import type { TemplateData } from "@/shared/types/template";
import { useEffect } from "react";

interface Params {
	activeElement: ActiveElement | null;
	editingTextId: string | null;
	setActiveElement: React.Dispatch<React.SetStateAction<ActiveElement | null>>;
	setTemplate: React.Dispatch<React.SetStateAction<TemplateData>>;
	allowDelete?: boolean;
}

export function useKeyboardDelete({
	activeElement,
	editingTextId,
	setActiveElement,
	setTemplate,
	allowDelete = true,
}: Params) {
	useEffect(() => {
		if (!allowDelete) return;
		const handler = (e: KeyboardEvent) => {
			const tag = (e.target as HTMLElement)?.tagName;
			if (
				tag === "INPUT" ||
				tag === "TEXTAREA" ||
				(e.target as HTMLElement).isContentEditable
			)
				return;
			if (
				!["Delete", "Backspace"].includes(e.key) ||
				!activeElement ||
				editingTextId
			)
				return;

			setTemplate((prev) => {
				const imgIdx = prev.images.findIndex((i) => i.id === activeElement.id);
				if (imgIdx >= 0) {
					const images = prev.images.toSpliced(imgIdx, 1);
					return { ...prev, images };
				}
				const txtIdx = prev.texts.findIndex((t) => t.id === activeElement.id);
				if (txtIdx >= 0) {
					const texts = prev.texts.toSpliced(txtIdx, 1);
					return { ...prev, texts };
				}
				const shpIdx = prev.shapes.findIndex((s) => s.id === activeElement.id);
				if (shpIdx >= 0) {
					const shapes = prev.shapes.toSpliced(shpIdx, 1);
					return { ...prev, shapes };
				}
				const lnIdx = prev.lines.findIndex((l) => l.id === activeElement.id);
				if (lnIdx >= 0) {
					const lines = prev.lines.toSpliced(lnIdx, 1);
					return { ...prev, lines };
				}
				return prev;
			});
			setActiveElement(null);
		};

		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [
		activeElement,
		editingTextId,
		allowDelete,
		setActiveElement,
		setTemplate,
	]);
}
