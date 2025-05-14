"use client";
import type { TemplateData } from "@/shared/types/template";
import { useEffect } from "react";

export function useImageReplace(
	setTemplate: React.Dispatch<React.SetStateAction<TemplateData>>,
) {
	useEffect(() => {
		const handler = (e: Event) => {
			const { id, src } = (e as CustomEvent<{ id: string; src: string }>)
				.detail;
			setTemplate((prev) => ({
				...prev,
				images: prev.images.map((img) =>
					img.id === id ? { ...img, src } : img,
				),
			}));
		};
		document.addEventListener("imageReplace", handler);
		return () => document.removeEventListener("imageReplace", handler);
	}, [setTemplate]);
}
