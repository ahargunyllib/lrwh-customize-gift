"use client";
import type { TemplateData } from "@/shared/types/template";
import { useEffect } from "react";

interface Params {
	activeElement: string | null;
	editingTextId: string | null;
	setActiveElement: (id: string | null) => void;
	setTemplate: React.Dispatch<React.SetStateAction<TemplateData>>;
}

export function useKeyboardDelete({
	activeElement,
	editingTextId,
	setActiveElement,
	setTemplate,
}: Params) {
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (
				!["Delete", "Backspace"].includes(e.key) ||
				!activeElement ||
				editingTextId
			)
				return;

			setTemplate((prev) => {
				const imgIdx = prev.images.findIndex((i) => i.id === activeElement);
				if (imgIdx >= 0) {
					const images = prev.images.toSpliced(imgIdx, 1);
					return { ...prev, images };
				}
				const txtIdx = prev.texts.findIndex((t) => t.id === activeElement);
				if (txtIdx >= 0) {
					const texts = prev.texts.toSpliced(txtIdx, 1);
					return { ...prev, texts };
				}
				return prev;
			});
			setActiveElement(null);
		};

		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [activeElement, editingTextId, setActiveElement, setTemplate]);
}
