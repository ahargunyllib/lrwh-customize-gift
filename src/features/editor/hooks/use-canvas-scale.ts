"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export function useCanvasScale(
	ref: React.RefObject<HTMLDivElement>,
	templateWidth: number,
) {
	const [scale, setScale] = useState(1);
	const hasManualZoomRef = useRef(false);

	useEffect(() => {
		const calc = () => {
			if (!ref.current) return;
			// Only auto-calculate initial scale, don't override manual zoom
			if (hasManualZoomRef.current) return;

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
		hasManualZoomRef.current = true;
		setScale((prev) => Math.min(3, prev + 0.05));
	}, []);

	const zoomOut = useCallback(() => {
		hasManualZoomRef.current = true;
		setScale((prev) => Math.max(0.1, prev - 0.05));
	}, []);

	const resetZoom = useCallback(() => {
		hasManualZoomRef.current = false;
		setScale(1);
	}, []);

	const handleZoom = useCallback((delta: number) => {
		hasManualZoomRef.current = true;
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
