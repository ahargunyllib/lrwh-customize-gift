"use client";
import html2canvas from "html2canvas";
import { useCallback } from "react";

export function useExportImage(ref: React.RefObject<HTMLElement>) {
	const exportAsImage = useCallback(async () => {
		if (!ref.current) return;
		const canvas = await html2canvas(ref.current, { backgroundColor: null });
		const blob = await new Promise<Blob | null>((res) =>
			canvas.toBlob(res, "image/png"),
		);
		if (!blob) return;

		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "template.png";
		link.click();
		URL.revokeObjectURL(url);
	}, [ref]);

	return { exportAsImage };
}
