import type { TemplateData } from "@/shared/types/template";
import { useCallback } from "react";
import { useTemplateContext } from "../containers/template-editor";

export function useBackgroundCanvas(
	setTemplate: React.Dispatch<React.SetStateAction<TemplateData>>,
) {
	const handleBackgroundChange = useCallback(
		(file: File) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				const result = e.target?.result as string;
				setTemplate((prev) => ({
					...prev,
					backgroundImage: result,
				}));
			};
			reader.readAsDataURL(file);
		},
		[setTemplate],
	);

	const removeBackground = useCallback(() => {
		setTemplate((prev) => ({
			...prev,
			backgroundImage: undefined,
		}));
	}, [setTemplate]);

	return { handleBackgroundChange, removeBackground };
}
