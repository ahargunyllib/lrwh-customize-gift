"use client";
import type { TemplateData } from "@/shared/types/template";
import { useEffect } from "react";

export function useElementCenter(
	setTemplate: React.Dispatch<React.SetStateAction<TemplateData>>,
) {
	useEffect(() => {
		const handler = (e: Event) => {
			const { id, type, axis } = (
				e as CustomEvent<{
					id: string;
					type: string;
					axis: "x" | "y" | "both";
				}>
			).detail;

			setTemplate((prev) => {
				if (type === "image") {
					return {
						...prev,
						images: prev.images.map((img) =>
							img.id === id
								? {
										...img,
										centerX: axis === "x" || axis === "both" || img.centerX,
										centerY: axis === "y" || axis === "both" || img.centerY,
									}
								: img,
						),
					};
				}
				if (type === "text") {
					return {
						...prev,
						texts: prev.texts.map((txt) =>
							txt.id === id
								? {
										...txt,
										style: {
											...txt.style,
											centerX:
												axis === "x" || axis === "both" || txt.style.centerX,
											centerY:
												axis === "y" || axis === "both" || txt.style.centerY,
										},
									}
								: txt,
						),
					};
				}
				return prev;
			});
		};
		document.addEventListener("elementCenter", handler);
		return () => document.removeEventListener("elementCenter", handler);
	}, [setTemplate]);
}
