"use client";

import type { ImageElement, TemplateData } from "@/shared/types/template";
import { useCallback } from "react";

interface UseImageAdjustProps {
	template: TemplateData;
	setTemplate: (template: TemplateData) => void;
}

export function useImageAdjust({ template, setTemplate }: UseImageAdjustProps) {
	const handleImageAdjust = useCallback(
		(e: CustomEvent) => {
			const { id, imageOffset, imageScale, rotate } = e.detail;

			setTemplate({
				...template,
				images: template.images.map((img) =>
					img.id === id
						? {
								...img,
								imageOffset: imageOffset || img.imageOffset,
								imageScale:
									imageScale !== undefined ? imageScale : img.imageScale,
								rotate: rotate !== undefined ? rotate : img.rotate,
							}
						: img,
				),
			});
		},
		[template, setTemplate],
	);

	return {
		handleImageAdjust,
	};
}
