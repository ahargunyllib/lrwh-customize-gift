import type { Axis } from "@/shared/lib/events";
import type { TemplateData } from "@/shared/types/template";
import { useEffect } from "react";

export function useElementCenter(
	setTemplate: React.Dispatch<React.SetStateAction<TemplateData>>,
) {
	useEffect(() => {
		function handler(e: Event) {
			const { id, axis } = (e as CustomEvent<{ id: string; axis: Axis }>)
				.detail;

			setTemplate((prev) => ({
				...prev,

				images: prev.images.map((img) =>
					img.id === id
						? {
								...img,
								centerX: axis === "x" || axis === "both" ? true : img.centerX,
								centerY: axis === "y" || axis === "both" ? true : img.centerY,
							}
						: img,
				),

				texts: prev.texts.map((txt) =>
					txt.id === id
						? {
								...txt,
								style: {
									...txt.style,
									centerX:
										axis === "x" || axis === "both" ? true : txt.style.centerX,
									centerY:
										axis === "y" || axis === "both" ? true : txt.style.centerY,
								},
							}
						: txt,
				),
			}));
		}

		document.addEventListener("elementCenter", handler);
		return () => document.removeEventListener("elementCenter", handler);
	}, [setTemplate]);
}
