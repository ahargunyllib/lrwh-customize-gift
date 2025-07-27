import { useCallback, useEffect, useRef, useState } from "react";

interface UseElementTransformOption {
	id: string;
	initialPosition: { x: number; y: number };
	width: number;
	height: number;
	scale: number;
	getSnapPosition?: (
		position: { x: number; y: number },
		width: number,
		height: number,
	) => { x: number; y: number };
	constrainToCanvas?: (
		position: { x: number; y: number },
		width: number,
		height: number,
	) => { x: number; y: number };
	onDrag?: (pos: { x: number; y: number }) => void;
}

export function useElementTransform({
	id,
	initialPosition,
	width,
	height,
	scale,
	getSnapPosition,
	constrainToCanvas,
	onDrag,
	onResize,
	onRotate,
}: UseElementTransformOption & {
	onResize?: (
		size: { width: number; height: number },
		position: { x: number; y: number },
	) => void;
	onRotate?: (angle: number) => void;
}) {
	const [isDragging, setIsDragging] = useState(false);
	const [isResizing, setIsResizing] = useState(false);
	const [isRotating, setIsRotating] = useState(false);
	const [resizeHandle, setResizeHandle] = useState<string | null>(null);

	const [position, setPosition] = useState(initialPosition);
	const [size, setSize] = useState({ width, height });
	const [rotation, setRotation] = useState(0);

	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
	const startMouse = useRef({ x: 0, y: 0 });
	const startSize = useRef({ width, height });
	const startPos = useRef(initialPosition);
	const startAngle = useRef(0);

	useEffect(() => {
		setPosition(initialPosition);
		setSize({ width, height });
	}, [initialPosition, width, height]);

	/** Start dragging the element itself */
	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			const canvas = document.querySelector('[data-canvas="true"]');
			if (!canvas) return;
			const canvasRect = canvas.getBoundingClientRect();
			setDragOffset({
				x: (e.clientX - canvasRect.left) / scale - position.x,
				y: (e.clientY - canvasRect.top) / scale - position.y,
			});
			setIsDragging(true);
		},
		[scale, position],
	);

	/** Start resizing */
	const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
		e.stopPropagation();
		e.preventDefault();
		setResizeHandle(handle);
		startMouse.current = { x: e.clientX, y: e.clientY };
		startSize.current = { ...size };
		startPos.current = { ...position };
		setIsResizing(true);
	};

	/** Start rotating */
	const handleRotateMouseDown = (e: React.MouseEvent) => {
		e.stopPropagation();
		e.preventDefault();
		startMouse.current = { x: e.clientX, y: e.clientY };
		startAngle.current = rotation;
		setIsRotating(true);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (!isDragging && !isResizing && !isRotating) return;

		const canvas = document.querySelector('[data-canvas="true"]');
		const canvasRect = canvas?.getBoundingClientRect();
		if (!canvasRect) return;

		const handleMouseMove = (e: MouseEvent) => {
			const mouseX = (e.clientX - canvasRect.left) / scale;
			const mouseY = (e.clientY - canvasRect.top) / scale;

			if (isDragging) {
				const newX = mouseX - dragOffset.x;
				const newY = mouseY - dragOffset.y;

				let newPosition = { x: newX, y: newY };
				if (getSnapPosition) {
					newPosition = getSnapPosition(newPosition, size.width, size.height);
				}

				setPosition(newPosition);
				onDrag?.(newPosition);
			} else if (isResizing && resizeHandle) {
				/** Compute delta mouse movement */
				const dx = (e.clientX - startMouse.current.x) / scale;
				const dy = (e.clientY - startMouse.current.y) / scale;

				let newWidth = startSize.current.width;
				let newHeight = startSize.current.height;
				const newPos = { ...startPos.current };

				/** Rotation in radians */
				const rad = (rotation * Math.PI) / 180;
				// Transform mouse delta into rotated space
				const rotatedDx = dx * Math.cos(rad) + dy * Math.sin(rad);
				const rotatedDy = -dx * Math.sin(rad) + dy * Math.cos(rad);

				/** Handle each direction */
				if (resizeHandle.includes("e")) {
					newWidth = Math.max(10, startSize.current.width + rotatedDx);
				}
				if (resizeHandle.includes("s")) {
					newHeight = Math.max(10, startSize.current.height + rotatedDy);
				}
				if (resizeHandle.includes("w")) {
					newWidth = Math.max(10, startSize.current.width - rotatedDx);
					newPos.x = startPos.current.x + rotatedDx;
				}
				if (resizeHandle.includes("n")) {
					newHeight = Math.max(10, startSize.current.height - rotatedDy);
					newPos.y = startPos.current.y + rotatedDy;
				}

				setSize({ width: newWidth, height: newHeight });
				setPosition(newPos);
				onResize?.({ width: newWidth, height: newHeight }, newPos);
			} else if (isRotating) {
				const centerX = position.x + size.width / 2;
				const centerY = position.y + size.height / 2;
				const angle = Math.atan2(mouseY - centerY, mouseX - centerX);
				const degrees = angle * (180 / Math.PI);
				setRotation(degrees);
				onRotate?.(degrees);
			}
		};

		const handleMouseUp = () => {
			setIsDragging(false);
			setIsResizing(false);
			setIsRotating(false);
			setResizeHandle(null);
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [
		isDragging,
		isResizing,
		isRotating,
		resizeHandle,
		dragOffset,
		position,
		size,
		rotation,
		scale,
	]);

	return {
		position,
		size,
		rotation,
		handleMouseDown,
		handleResizeMouseDown,
		handleRotateMouseDown,
	};
}
