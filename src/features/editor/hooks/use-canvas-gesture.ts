import { useEffect, useState } from "react";

export function useCanvasGesture() {
	const [isPanning, setIsPanning] = useState(false);
	const [panStart, setPanStart] = useState({ x: 0, y: 0 });
	const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

	const handleCanvasMouseDown = (
		e: React.MouseEvent<HTMLDivElement, MouseEvent>,
	) => {
		if (e.button === 1 || (e.button === 0 && e.altKey)) {
			// Middle mouse or Alt+click
			e.preventDefault();
			setIsPanning(true);
			setPanStart({
				x: e.clientX - canvasOffset.x,
				y: e.clientY - canvasOffset.y,
			});
		}
	};

	const handleCanvasMouseMove = (
		e: React.MouseEvent<HTMLDivElement, MouseEvent>,
	) => {
		if (isPanning) {
			setCanvasOffset({
				x: e.clientX - panStart.x,
				y: e.clientY - panStart.y,
			});
		}
	};

	const handleCanvasMouseUp = () => {
		setIsPanning(false);
	};

	const handleCanvasTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
		// Only handle single touch for panning
		if (e.touches.length === 1) {
			setIsPanning(true);
			const touch = e.touches[0];
			setPanStart({
				x: touch.clientX - canvasOffset.x,
				y: touch.clientY - canvasOffset.y,
			});
		}
	};

	const handleCanvasTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
		if (isPanning && e.touches.length === 1) {
			const touch = e.touches[0];
			setCanvasOffset({
				x: touch.clientX - panStart.x,
				y: touch.clientY - panStart.y,
			});
		}
	};

	const handleCanvasTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
		// End panning when all touches are lifted
		if (e.touches.length === 0) {
			setIsPanning(false);
		}
	};

	useEffect(() => {
		// Disable scrolling
		document.body.style.overflow = "hidden";
		document.documentElement.style.overflow = "hidden";

		// Cleanup on unmount
		return () => {
			document.body.style.overflow = "";
			document.documentElement.style.overflow = "";
		};
	}, []);

	const handlers = {
		onMouseDown: handleCanvasMouseDown,
		onMouseMove: handleCanvasMouseMove,
		onMouseUp: handleCanvasMouseUp,
		onTouchStart: handleCanvasTouchStart,
		onTouchMove: handleCanvasTouchMove,
		onTouchEnd: handleCanvasTouchEnd,
	};

	return {
		isPanning,
		canvasOffset,
		bindGesture: handlers,
	};
}
