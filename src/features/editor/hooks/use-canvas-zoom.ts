"use client";
import { type RefObject, useCallback, useEffect, useState } from "react";

interface UseCanvasZoomProps {
	containerRef: RefObject<HTMLDivElement>;
	canvasWidth: number;
	canvasHeight: number;
	padding?: number;
}

export function useCanvasZoom({
	containerRef,
	canvasWidth,
	canvasHeight,
	padding = 40,
}: UseCanvasZoomProps) {
	const [scale, setScale] = useState(1);
	const [zoom, setZoom] = useState(100); // Zoom percentage
	const [isAutoFit, setIsAutoFit] = useState(true);

	// Calculate the scale to fit the canvas in the container
	const calculateFitScale = useCallback(() => {
		if (!containerRef.current) return 1;

		const containerWidth = containerRef.current.clientWidth - padding * 2;
		const containerHeight = containerRef.current.clientHeight - padding * 2;

		// Calculate scale based on both width and height constraints
		const scaleX = containerWidth / canvasWidth;
		const scaleY = containerHeight / canvasHeight;

		// Use the smaller scale to ensure the canvas fits entirely
		return Math.min(scaleX, scaleY, 1); // Cap at 100% to avoid making it larger than actual size
	}, [containerRef, canvasWidth, canvasHeight, padding]);

	// Update scale when container size changes or when zoom is manually adjusted
	const updateScale = useCallback(() => {
		if (isAutoFit) {
			const newScale = calculateFitScale();
			setScale(newScale);
			setZoom(Math.round(newScale * 100));
		}
	}, [calculateFitScale, isAutoFit]);

	// Handle manual zoom changes
	const handleZoomChange = useCallback((newZoom: number) => {
		setIsAutoFit(false);
		setZoom(newZoom);
		setScale(newZoom / 100);
	}, []);

	// Fit to screen function
	const fitToScreen = useCallback(() => {
		setIsAutoFit(true);
		updateScale();
	}, [updateScale]);

	// Zoom in/out functions
	const zoomIn = useCallback(() => {
		setIsAutoFit(false);
		const newZoom = Math.min(zoom + 10, 200); // Cap at 200%
		setZoom(newZoom);
		setScale(newZoom / 100);
	}, [zoom]);

	const zoomOut = useCallback(() => {
		setIsAutoFit(false);
		const newZoom = Math.max(zoom - 10, 10); // Minimum 10%
		setZoom(newZoom);
		setScale(newZoom / 100);
	}, [zoom]);

	// Update scale on window resize
	useEffect(() => {
		if (isAutoFit) {
			updateScale();
		}

		const handleResize = () => {
			if (isAutoFit) {
				updateScale();
			}
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [updateScale, isAutoFit]);

	// Update scale when canvas dimensions change
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (isAutoFit) {
			updateScale();
		}
	}, [canvasWidth, canvasHeight, updateScale, isAutoFit]);

	return {
		scale,
		zoom,
		isAutoFit,
		zoomIn,
		zoomOut,
		handleZoomChange,
		fitToScreen,
	};
}
