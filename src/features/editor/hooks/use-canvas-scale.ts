"use client";
import { useCallback, useEffect, useState } from "react";

export function useCanvasScale(
	ref: React.RefObject<HTMLDivElement>,
	templateWidth: number,
) {
	const [scale, setScale] = useState(1);

	useEffect(() => {
		const calc = () => {
			if (!ref.current) return;
			const deviceWidth = window.innerWidth;

			if (deviceWidth < 640) {
				setScale(0.6);
				return;
			}
			const containerWidth = ref.current.clientWidth - 32; // padding
			setScale(Math.min(1, containerWidth / templateWidth));
		};
		calc();
		window.addEventListener("resize", calc);
		return () => window.removeEventListener("resize", calc);
	}, [ref, templateWidth]);

	const zoomIn = useCallback(() => {
		setScale((prev) => Math.min(3, prev + 0.05));
	}, []);

	const zoomOut = useCallback(() => {
		setScale((prev) => Math.max(0.1, prev - 0.05));
	}, []);

	const resetZoom = useCallback(() => {
		setScale(1);
	}, []);

	const handleZoom = useCallback((delta: number) => {
		setScale((prev) => {
			const newScale = prev + delta;
			return Math.max(0.1, Math.min(3, newScale));
		});
	}, []);

	return {
		scale,
		zoomIn,
		zoomOut,
		resetZoom,
		setScale,
		handleZoom,
	};
}
