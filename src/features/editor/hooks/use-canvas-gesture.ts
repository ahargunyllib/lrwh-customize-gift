import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Canvas gesture handling hook
 *
 * Desktop gestures:
 * - Mouse wheel: Zoom in/out
 * - Touchpad pinch (Ctrl+scroll): Zoom in/out
 * - Alt/Cmd/Ctrl + drag: Pan the canvas
 * - Middle mouse button drag: Pan the canvas
 *
 * Mobile gestures:
 * - Pinch (two fingers): Zoom in/out
 * - Single finger drag: Pan the canvas
 */
export function useCanvasGesture(onZoom?: (delta: number) => void) {
	const [isPanning, setIsPanning] = useState(false);
	const [panStart, setPanStart] = useState({ x: 0, y: 0 });
	const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

	const [initialTouchDistance, setInitialTouchDistance] = useState(0);
	const [isZooming, setIsZooming] = useState(false);

	const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastZoomTimeRef = useRef<number>(0);
	const accumulatedZoomRef = useRef<number>(0);

	const debouncedZoom = useCallback(
		(delta: number) => {
			if (!onZoom) return;

			const now = Date.now();
			const timeSinceLastZoom = now - lastZoomTimeRef.current;

			accumulatedZoomRef.current += delta;

			if (zoomTimeoutRef.current) {
				clearTimeout(zoomTimeoutRef.current);
			}

			zoomTimeoutRef.current = setTimeout(() => {
				if (accumulatedZoomRef.current !== 0) {
					onZoom(accumulatedZoomRef.current);
					accumulatedZoomRef.current = 0;
					lastZoomTimeRef.current = Date.now();
				}
			}, 16); // ~60fps
		},
		[onZoom],
	);

	const getTouchDistance = useCallback((touches: TouchList) => {
		if (touches.length < 2) return 0;
		const touch1 = touches[0];
		const touch2 = touches[1];
		return Math.sqrt(
			(touch2.clientX - touch1.clientX) ** 2 +
				(touch2.clientY - touch1.clientY) ** 2,
		);
	}, []);

	const handleCanvasMouseDown = (
		e: React.MouseEvent<HTMLDivElement, MouseEvent>,
	) => {
		if (
			e.button === 1 ||
			(e.button === 0 && (e.altKey || e.metaKey || e.ctrlKey))
		) {
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
			document.body.style.cursor = "grabbing";
			setCanvasOffset({
				x: e.clientX - panStart.x,
				y: e.clientY - panStart.y,
			});
		}
	};

	const handleCanvasMouseUp = () => {
		setIsPanning(false);
		document.body.style.cursor = "default";
	};

	const handleCanvasWheel = (e: React.WheelEvent<HTMLDivElement>) => {
		e.preventDefault(); // Always prevent default to block browser zoom

		// Touchpad pinch zoom (Ctrl+wheel) or regular mouse wheel
		if (e.ctrlKey) {
			// Touchpad pinch: use larger delta for direct zoom response
			const delta = e.deltaY > 0 ? -0.05 : 0.05;
			if (onZoom) onZoom(delta); // Direct call for instant response
		} else {
			// Regular mouse wheel: smaller delta with debouncing
			const delta = e.deltaY > 0 ? -0.02 : 0.02;
			debouncedZoom(delta);
		}
	};

	const handleCanvasTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
		if (e.touches.length === 1) {
			// Single touch - allow normal interaction, prepare for potential panning
			// Don't prevent default here to allow clicks
			setIsPanning(false); // Don't start panning immediately
			setIsZooming(false);
			const touch = e.touches[0];
			setPanStart({
				x: touch.clientX - canvasOffset.x,
				y: touch.clientY - canvasOffset.y,
			});
		} else if (e.touches.length === 2) {
			// Two touches - prevent default and start zooming
			e.preventDefault();
			e.stopPropagation();
			setIsPanning(false);
			setIsZooming(true);
			const distance = getTouchDistance(e.touches as unknown as TouchList);
			setInitialTouchDistance(distance);
		}
	};

	const handleCanvasTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
		if (e.touches.length === 1 && !isZooming) {
			// Single touch - check if we should start panning
			const touch = e.touches[0];
			const deltaX = Math.abs(touch.clientX - (panStart.x + canvasOffset.x));
			const deltaY = Math.abs(touch.clientY - (panStart.y + canvasOffset.y));
			const threshold = 10; // Minimum movement to start panning

			if (deltaX > threshold || deltaY > threshold) {
				// Movement detected, start panning and prevent default
				if (!isPanning) {
					e.preventDefault();
					setIsPanning(true);
				}
			}

			if (isPanning) {
				e.preventDefault();
				setCanvasOffset({
					x: touch.clientX - panStart.x,
					y: touch.clientY - panStart.y,
				});
			}
		} else if (e.touches.length === 2 && isZooming) {
			// Two touch zooming (pinch) - always prevent default
			e.preventDefault();
			e.stopPropagation();

			const currentDistance = getTouchDistance(
				e.touches as unknown as TouchList,
			);
			if (initialTouchDistance > 0 && onZoom) {
				const distanceRatio = currentDistance / initialTouchDistance;
				const zoomDelta = (distanceRatio - 1) * 0.5; // Increased sensitivity

				if (Math.abs(zoomDelta) > 0.001) {
					// Lower threshold for smoother zoom
					onZoom(zoomDelta); // Direct call for instant response
					setInitialTouchDistance(currentDistance);
				}
			}
		} else if (e.touches.length === 2 && !isZooming) {
			// Two touches but not in zoom mode - prevent default to avoid browser zoom
			e.preventDefault();
			e.stopPropagation();
		}
	};

	const handleCanvasTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
		if (e.touches.length === 0) {
			// All touches lifted
			setIsPanning(false);
			setIsZooming(false);
			setInitialTouchDistance(0);
		} else if (e.touches.length === 1 && isZooming) {
			// Went from 2 touches to 1 - switch to potential panning
			setIsZooming(false);
			setIsPanning(false); // Don't immediately start panning
			const touch = e.touches[0];
			setPanStart({
				x: touch.clientX - canvasOffset.x,
				y: touch.clientY - canvasOffset.y,
			});
		} else if (e.touches.length >= 2) {
			// Still have multiple touches, prevent default
			e.preventDefault();
		}
	};

	useEffect(() => {
		// Store original values for cleanup
		const originalBodyOverflow = document.body.style.overflow;
		const originalDocumentOverflow = document.documentElement.style.overflow;
		const originalViewport = document
			.querySelector('meta[name="viewport"]')
			?.getAttribute("content");

		// Only prevent scrolling, don't mess with touch-action on body
		document.body.style.overflow = "hidden";
		document.documentElement.style.overflow = "hidden";

		// Prevent viewport zoom on mobile - only allow canvas zoom
		const viewportMeta =
			document.querySelector('meta[name="viewport"]') ||
			document.createElement("meta");
		viewportMeta.setAttribute("name", "viewport");
		viewportMeta.setAttribute(
			"content",
			"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover",
		);
		if (!document.querySelector('meta[name="viewport"]')) {
			document.head.appendChild(viewportMeta);
		}

		// Global mouse event handlers to fix panning outside canvas
		const handleGlobalMouseMove = (e: MouseEvent) => {
			if (isPanning) {
				setCanvasOffset({
					x: e.clientX - panStart.x,
					y: e.clientY - panStart.y,
				});
			}
		};

		const handleGlobalMouseUp = () => {
			if (isPanning) {
				setIsPanning(false);
			}
		};

		// Prevent browser zoom from touchpad pinch (Ctrl+wheel)
		const handleGlobalWheel = (e: WheelEvent) => {
			if (e.ctrlKey) {
				e.preventDefault(); // Block browser pinch zoom
			}
		};

		// Add event listeners
		document.addEventListener("mousemove", handleGlobalMouseMove);
		document.addEventListener("mouseup", handleGlobalMouseUp);
		document.addEventListener("wheel", handleGlobalWheel, { passive: false });

		// Cleanup on unmount
		return () => {
			document.body.style.overflow = originalBodyOverflow;
			document.documentElement.style.overflow = originalDocumentOverflow;
			document.body.style.cursor = "default";

			// Restore original viewport if it existed
			if (originalViewport) {
				viewportMeta.setAttribute("content", originalViewport);
			}

			// Clear zoom timeout
			if (zoomTimeoutRef.current) {
				clearTimeout(zoomTimeoutRef.current);
			}

			// Remove event listeners
			document.removeEventListener("mousemove", handleGlobalMouseMove);
			document.removeEventListener("mouseup", handleGlobalMouseUp);
			document.removeEventListener("wheel", handleGlobalWheel);
		};
	}, [isPanning, panStart]);

	const handlers = {
		onMouseDown: handleCanvasMouseDown,
		onMouseMove: handleCanvasMouseMove,
		onMouseUp: handleCanvasMouseUp,
		onWheel: handleCanvasWheel,
		onTouchStart: handleCanvasTouchStart,
		onTouchMove: handleCanvasTouchMove,
		onTouchEnd: handleCanvasTouchEnd,
	};

	return {
		isPanning,
		isZooming,
		canvasOffset,
		bindGesture: handlers,
	};
}
