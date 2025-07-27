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
	const offset = useRef({ x: 0, y: 0 });
	const dragRef = useRef({ start, end });

	useEffect(() => {
		setStartPoint(start);
		setEndPoint(end);
		dragRef.current = { start, end };
	}, [start, end]);

	useEffect(() => {
		if (!dragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			const x = e.clientX / scale;
			const y = e.clientY / scale;

			if (dragging === "line") {
				const dx = x - offset.current.x;
				const dy = y - offset.current.y;

				const newStart = {
					x: dragRef.current.start.x + dx,
					y: dragRef.current.start.y + dy,
				};
				const newEnd = {
					x: dragRef.current.end.x + dx,
					y: dragRef.current.end.y + dy,
				};

				setStartPoint(newStart);
				setEndPoint(newEnd);
				onChange?.({ start: newStart, end: newEnd });

				// Update offset and dragRef
				offset.current = { x, y };
				dragRef.current = { start: newStart, end: newEnd };
			} else if (dragging === "start") {
				const newStart = {
					x: x - offset.current.x,
					y: y - offset.current.y,
				};
				setStartPoint(newStart);
				onChange?.({ start: newStart, end: endPoint });
				dragRef.current.start = newStart;
			} else if (dragging === "end") {
				const newEnd = {
					x: x - offset.current.x,
					y: y - offset.current.y,
				};
				setEndPoint(newEnd);
				onChange?.({ start: startPoint, end: newEnd });
				dragRef.current.end = newEnd;
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
			const x = e.clientX / scale;
			const y = e.clientY / scale;
			offset.current = { x, y };
			dragRef.current = { start: startPoint, end: endPoint }; // sync ref
			setDragging("line");
		},
		startEndpointDrag: (which: "start" | "end") => (e: React.MouseEvent) => {
			e.stopPropagation();
			const x = e.clientX / scale;
			const y = e.clientY / scale;

			const point = which === "start" ? startPoint : endPoint;
			offset.current = {
				x: x - point.x,
				y: y - point.y,
			};

			setDragging(which);
		},
		isDragging: dragging !== null,
	};
}
