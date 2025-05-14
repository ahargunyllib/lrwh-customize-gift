"use client";
import { useEffect, useState } from "react";

export function useCanvasScale(
	ref: React.RefObject<HTMLDivElement>,
	templateWidth: number,
) {
	const [scale, setScale] = useState(1);

	useEffect(() => {
		const calc = () => {
			if (!ref.current) return;
			const containerWidth = ref.current.clientWidth - 32; // padding
			setScale(Math.min(1, containerWidth / templateWidth));
		};
		calc();
		window.addEventListener("resize", calc);
		return () => window.removeEventListener("resize", calc);
	}, [ref, templateWidth]);

	return scale;
}
