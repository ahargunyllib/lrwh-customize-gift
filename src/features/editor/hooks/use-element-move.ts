"use client";
import type { Position, TemplateData } from "@/shared/types/template";
import { useCallback, useEffect } from "react";

export function useElementMove(
	setTemplate: React.Dispatch<React.SetStateAction<TemplateData>>,
) {
	const handler = useCallback(
		(e: Event) => {
			const { id, type, position } = (
				e as CustomEvent<{
					id: string;
					type: string;
					position: Position;
				}>
			).detail;

			setTemplate((prev) => {
				if (type === "image") {
					return {
						...prev,
						images: prev.images.map((img) =>
							img.id === id
								? { ...img, position, centerX: false, centerY: false }
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
										position,
										style: { ...txt.style, centerX: false, centerY: false },
									}
								: txt,
						),
					};
				}
				return prev;
			});
		},
		[setTemplate],
	);

	useEffect(() => {
		document.addEventListener("elementMove", handler);
		return () => document.removeEventListener("elementMove", handler);
	}, [handler]);
}
