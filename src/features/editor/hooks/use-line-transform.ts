import { useEffect, useRef, useState } from "react";

interface UseLineTransformOptions {
	start: { x: number; y: number };
	end: { x: number; y: number };
	scale: number;
	onChange?: (points: {
		start: { x: number; y: number };
		end: { x: number; y: number };
	}) => void;
}

export function useLineTransform({
	start,
	end,
	scale,
	onChange,
}: UseLineTransformOptions) {
	const [startPoint, setStartPoint] = useState(start);
	const [endPoint, setEndPoint] = useState(end);
	const [dragging, setDragging] = useState<null | "line" | "start" | "end">(
		null,
	);

	// Keep refs to avoid stale values during drag
	const initialMousePos = useRef({ x: 0, y: 0 });
	const initialPoints = useRef({ start, end });
	const svgElementRef = useRef<SVGSVGElement | null>(null);

	useEffect(() => {
		setStartPoint(start);
		setEndPoint(end);
	}, [start, end]);

	// Helper function to convert screen coordinates to SVG coordinates
	const screenToSVG = (
		screenX: number,
		screenY: number,
		svgElement: SVGSVGElement,
	) => {
		const pt = svgElement.createSVGPoint();
		pt.x = screenX;
		pt.y = screenY;
		return pt.matrixTransform(svgElement.getScreenCTM()?.inverse());
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (!dragging || !svgElementRef.current) return;

		const handleMouseMove = (e: MouseEvent) => {
			if (!svgElementRef.current) return;
			const svgCoords = screenToSVG(
				e.clientX,
				e.clientY,
				svgElementRef.current,
			);
			const initialSvgCoords = screenToSVG(
				initialMousePos.current.x,
				initialMousePos.current.y,
				svgElementRef.current,
			);

			const deltaX = (svgCoords.x - initialSvgCoords.x) / scale;
			const deltaY = (svgCoords.y - initialSvgCoords.y) / scale;

			if (dragging === "line") {
				const newStart = {
					x: initialPoints.current.start.x + deltaX,
					y: initialPoints.current.start.y + deltaY,
				};
				const newEnd = {
					x: initialPoints.current.end.x + deltaX,
					y: initialPoints.current.end.y + deltaY,
				};

				setStartPoint(newStart);
				setEndPoint(newEnd);
				onChange?.({ start: newStart, end: newEnd });
			} else if (dragging === "start") {
				const newStart = {
					x: initialPoints.current.start.x + deltaX,
					y: initialPoints.current.start.y + deltaY,
				};
				setStartPoint(newStart);
				onChange?.({ start: newStart, end: endPoint });
			} else if (dragging === "end") {
				const newEnd = {
					x: initialPoints.current.end.x + deltaX,
					y: initialPoints.current.end.y + deltaY,
				};
				setEndPoint(newEnd);
				onChange?.({ start: startPoint, end: newEnd });
			}
		};

		const handleMouseUp = () => setDragging(null);

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [dragging, scale, onChange, endPoint, startPoint]);

	return {
		startPoint,
		endPoint,
		startLineDrag: (e: React.MouseEvent) => {
			e.stopPropagation();
			const svg = e.currentTarget.closest("svg") as SVGSVGElement;
			svgElementRef.current = svg;
			initialMousePos.current = { x: e.clientX, y: e.clientY };
			initialPoints.current = { start: startPoint, end: endPoint };
			setDragging("line");
		},
		startEndpointDrag: (which: "start" | "end") => (e: React.MouseEvent) => {
			e.stopPropagation();
			const svg = e.currentTarget.closest("svg") as SVGSVGElement;
			svgElementRef.current = svg;
			initialMousePos.current = { x: e.clientX, y: e.clientY };
			initialPoints.current = { start: startPoint, end: endPoint };
			setDragging(which);
		},
		isDragging: dragging !== null,
	};
}
