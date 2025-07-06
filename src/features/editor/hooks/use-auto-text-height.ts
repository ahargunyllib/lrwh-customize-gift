"use client";

import type React from "react";

import { calculateTextHeight } from "@/shared/lib/elements";
import type { TemplateData } from "@/shared/types/template";
import { useCallback } from "react";

interface UseAutoTextHeightProps {
	setTemplate: React.Dispatch<React.SetStateAction<TemplateData>>;
}

export function useAutoTextHeight({ setTemplate }: UseAutoTextHeightProps) {
	const updateTextHeight = useCallback(
		(textId: string, content?: string) => {
			setTemplate((prev) => ({
				...prev,
				texts: prev.texts.map((text) => {
					if (text.id !== textId) return text;

					const textContent = content !== undefined ? content : text.content;
					const fontSize =
						typeof text.style.fontSize === "string"
							? Number.parseFloat(text.style.fontSize)
							: text.style.fontSize;
					const padding =
						typeof text.style.padding === "string"
							? Number.parseFloat(text.style.padding)
							: text.style.padding || 8;

					const calculation = calculateTextHeight(
						textContent,
						fontSize,
						text.style.lineHeight,
						text.width || 200,
						text.style.fontFamily,
						padding,
					);

					return {
						...text,
						content: textContent,
						height: calculation.requiredHeight,
					};
				}),
			}));
		},
		[setTemplate],
	);

	const updateTextHeightOnResize = useCallback(
		(textId: string, newWidth: number) => {
			setTemplate((prev) => ({
				...prev,
				texts: prev.texts.map((text) => {
					if (text.id !== textId) return text;

					const fontSize =
						typeof text.style.fontSize === "string"
							? Number.parseFloat(text.style.fontSize)
							: text.style.fontSize;
					const padding =
						typeof text.style.padding === "string"
							? Number.parseFloat(text.style.padding)
							: text.style.padding || 8;

					const calculation = calculateTextHeight(
						text.content,
						fontSize,
						text.style.lineHeight,
						newWidth,
						text.style.fontFamily,
						padding,
					);

					return {
						...text,
						width: newWidth,
						height: calculation.requiredHeight,
					};
				}),
			}));
		},
		[setTemplate],
	);

	return {
		updateTextHeight,
		updateTextHeightOnResize,
	};
}
