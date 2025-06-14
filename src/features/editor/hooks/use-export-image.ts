"use client";
import { toPng } from "html-to-image";
import { useCallback } from "react";

export function useExportImage(ref: React.RefObject<HTMLElement>) {
	const exportAsImage = useCallback(async () => {
		if (!ref.current) return;
		const dataUrl = await toPng(ref.current);
		const link = document.createElement("a");
		link.href = dataUrl;
		link.download = "LRWH Customize Gift.png";
		link.click();
	}, [ref]);

	return { exportAsImage };
}
