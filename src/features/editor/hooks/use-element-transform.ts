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
	// Snapping options
	enableGridSnap?: boolean;
	gridSize?: number;
	snapThreshold?: number;
	snapToElements?: Array<{
		x: number;
		y: number;
		width: number;
		height: number;
		id: string;
	}>;
	// Rotation snapping options
	enableRotationSnap?: boolean;
	rotationSnapAngle?: number; // degrees (e.g., 15 for 15° increments)
	rotationSnapThreshold?: number; // degrees
	// Resize snapping options
	enableResizeSnap?: boolean;
	resizeSnapThreshold?: number;
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
	enableGridSnap = false,
	gridSize = 20,
	snapThreshold = 10,
	snapToElements = [],
	enableRotationSnap = false,
	rotationSnapAngle = 15,
	rotationSnapThreshold = 5,
	enableResizeSnap = false,
	resizeSnapThreshold = 10,
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
	const startRotation = useRef(0);

	useEffect(() => {
		setPosition(initialPosition);
		setSize({ width, height });
	}, [initialPosition, width, height]);

	/** Grid snapping function */
	const snapToGrid = useCallback(
		(pos: { x: number; y: number }) => {
			if (!enableGridSnap) return pos;
			return {
				x: Math.round(pos.x / gridSize) * gridSize,
				y: Math.round(pos.y / gridSize) * gridSize,
			};
		},
		[enableGridSnap, gridSize],
	);

	/** Element-to-element snapping function */
	const snapToOtherElements = useCallback(
		(
			pos: { x: number; y: number },
			currentWidth: number,
			currentHeight: number,
		) => {
			if (!snapToElements.length) return pos;

			let snappedX = pos.x;
			let snappedY = pos.y;
			let minXDistance = Number.POSITIVE_INFINITY;
			let minYDistance = Number.POSITIVE_INFINITY;

			// Current element bounds
			const currentLeft = pos.x;
			const currentRight = pos.x + currentWidth;
			const currentTop = pos.y;
			const currentBottom = pos.y + currentHeight;
			const currentCenterX = pos.x + currentWidth / 2;
			const currentCenterY = pos.y + currentHeight / 2;

			// biome-ignore lint/complexity/noForEach: <explanation>
			snapToElements
				.filter((el) => el.id !== id) // Don't snap to self
				.forEach((element) => {
					const { x, y, width: elWidth, height: elHeight } = element;
					const elLeft = x;
					const elRight = x + elWidth;
					const elTop = y;
					const elBottom = y + elHeight;
					const elCenterX = x + elWidth / 2;
					const elCenterY = y + elHeight / 2;

					// Horizontal snapping (X-axis)
					const snapPoints = [
						{ value: elLeft, target: currentLeft }, // left to left
						{ value: elRight, target: currentLeft }, // left to right
						{ value: elLeft, target: currentRight }, // right to left
						{ value: elRight, target: currentRight }, // right to right
						{ value: elCenterX, target: currentCenterX }, // center to center
					];

					// biome-ignore lint/complexity/noForEach: <explanation>
					snapPoints.forEach(({ value, target }) => {
						const distance = Math.abs(target - value);
						if (distance < snapThreshold && distance < minXDistance) {
							minXDistance = distance;
							snappedX = pos.x + (value - target);
						}
					});

					// Vertical snapping (Y-axis)
					const ySnapPoints = [
						{ value: elTop, target: currentTop }, // top to top
						{ value: elBottom, target: currentTop }, // top to bottom
						{ value: elTop, target: currentBottom }, // bottom to top
						{ value: elBottom, target: currentBottom }, // bottom to bottom
						{ value: elCenterY, target: currentCenterY }, // center to center
					];

					// biome-ignore lint/complexity/noForEach: <explanation>
					ySnapPoints.forEach(({ value, target }) => {
						const distance = Math.abs(target - value);
						if (distance < snapThreshold && distance < minYDistance) {
							minYDistance = distance;
							snappedY = pos.y + (value - target);
						}
					});
				});

			return { x: snappedX, y: snappedY };
		},
		[snapToElements, snapThreshold, id],
	);

	/** Combined snapping function */
	const applySnapping = useCallback(
		(
			pos: { x: number; y: number },
			currentWidth: number,
			currentHeight: number,
		) => {
			let snappedPos = pos;

			// Apply grid snapping first
			snappedPos = snapToGrid(snappedPos);

			// Apply element snapping
			snappedPos = snapToOtherElements(snappedPos, currentWidth, currentHeight);

			// Apply custom snap position if provided
			if (getSnapPosition) {
				snappedPos = getSnapPosition(snappedPos, currentWidth, currentHeight);
			}

			// Apply canvas constraints if provided
			if (constrainToCanvas) {
				snappedPos = constrainToCanvas(snappedPos, currentWidth, currentHeight);
			}

			return snappedPos;
		},
		[snapToGrid, snapToOtherElements, getSnapPosition, constrainToCanvas],
	);

	/** Rotation snapping function */
	const snapRotation = useCallback(
		(angle: number) => {
			if (!enableRotationSnap) return angle;

			// Normalize angle to 0-360 range
			const normalizedAngle = ((angle % 360) + 360) % 360;

			// Find the nearest snap angle
			const snapAngle =
				Math.round(normalizedAngle / rotationSnapAngle) * rotationSnapAngle;
			const distance = Math.abs(normalizedAngle - snapAngle);

			// Apply snapping if within threshold
			if (distance <= rotationSnapThreshold) {
				return snapAngle;
			}

			return angle;
		},
		[enableRotationSnap, rotationSnapAngle, rotationSnapThreshold],
	);

	/** Size snapping function for resize operations */
	const snapSize = useCallback(
		(
			size: { width: number; height: number },
			pos: { x: number; y: number },
		) => {
			if (!enableResizeSnap) return { size, pos };

			const snappedSize = { ...size };
			const adjustedPos = { ...pos };

			if (enableGridSnap) {
				// Snap dimensions to grid
				const gridSnappedWidth = Math.round(size.width / gridSize) * gridSize;
				const gridSnappedHeight = Math.round(size.height / gridSize) * gridSize;

				if (Math.abs(size.width - gridSnappedWidth) < resizeSnapThreshold) {
					snappedSize.width = gridSnappedWidth;
				}
				if (Math.abs(size.height - gridSnappedHeight) < resizeSnapThreshold) {
					snappedSize.height = gridSnappedHeight;
				}
			}

			// Snap to other elements' dimensions
			// biome-ignore lint/complexity/noForEach: <explanation>
			snapToElements
				.filter((el) => el.id !== id)
				.forEach((element) => {
					// Width snapping
					if (Math.abs(size.width - element.width) < resizeSnapThreshold) {
						snappedSize.width = element.width;
					}
					// Height snapping
					if (Math.abs(size.height - element.height) < resizeSnapThreshold) {
						snappedSize.height = element.height;
					}
				});

			// Apply position snapping after size adjustment
			const newPos = applySnapping(
				adjustedPos,
				snappedSize.width,
				snappedSize.height,
			);

			return { size: snappedSize, pos: newPos };
		},
		[
			enableResizeSnap,
			enableGridSnap,
			gridSize,
			resizeSnapThreshold,
			snapToElements,
			id,
			applySnapping,
		],
	);

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

		const canvas = document.querySelector('[data-canvas="true"]');
		if (!canvas) return;
		const canvasRect = canvas.getBoundingClientRect();

		// Calculate mouse position relative to canvas
		const mouseX = (e.clientX - canvasRect.left) / scale;
		const mouseY = (e.clientY - canvasRect.top) / scale;

		// Calculate element center
		const centerX = position.x + size.width / 2;
		const centerY = position.y + size.height / 2;

		// Calculate initial angle from center to mouse
		const initialAngle = Math.atan2(mouseY - centerY, mouseX - centerX);
		const initialDegrees = initialAngle * (180 / Math.PI);

		startMouse.current = { x: e.clientX, y: e.clientY };
		startAngle.current = initialDegrees;
		startRotation.current = rotation;
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

				// disable snapping on hold shift
				if (e.shiftKey) {
					newPosition = { x: newX, y: newY };
				} else {
					newPosition = applySnapping(newPosition, size.width, size.height);
				}

				setPosition(newPosition);
				onDrag?.(newPosition);
			} else if (isResizing && resizeHandle) {
				/** Compute delta mouse movement */
				const dx = (e.clientX - startMouse.current.x) / scale;
				const dy = (e.clientY - startMouse.current.y) / scale;

				let newWidth = startSize.current.width;
				let newHeight = startSize.current.height;
				let newPos = { ...startPos.current };

				/** Rotation in radians */
				const rad = (rotation * Math.PI) / 180;
				const cos = Math.cos(rad);
				const sin = Math.sin(rad);

				// Transform mouse delta into element's local coordinate space
				const localDx = dx * cos + dy * sin;
				const localDy = -dx * sin + dy * cos;

				// Calculate the center of the element before resize
				const centerX = startPos.current.x + startSize.current.width / 2;
				const centerY = startPos.current.y + startSize.current.height / 2;

				/** Handle each direction with proper rotation consideration */
				let widthDelta = 0;
				let heightDelta = 0;
				let centerOffsetX = 0;
				let centerOffsetY = 0;

				if (resizeHandle.includes("e")) {
					widthDelta = localDx;
					centerOffsetX = localDx / 2;
				}
				if (resizeHandle.includes("w")) {
					widthDelta = -localDx;
					centerOffsetX = -localDx / 2;
				}
				if (resizeHandle.includes("s")) {
					heightDelta = localDy;
					centerOffsetY = localDy / 2;
				}
				if (resizeHandle.includes("n")) {
					heightDelta = -localDy;
					centerOffsetY = -localDy / 2;
				}

				// Apply size changes
				newWidth = Math.max(10, startSize.current.width + widthDelta);
				newHeight = Math.max(10, startSize.current.height + heightDelta);

				// Calculate new center position in rotated space
				const newCenterX = centerX + centerOffsetX * cos - centerOffsetY * sin;
				const newCenterY = centerY + centerOffsetX * sin + centerOffsetY * cos;

				// Calculate new top-left position from center
				newPos = {
					x: newCenterX - newWidth / 2,
					y: newCenterY - newHeight / 2,
				};

				// Apply resize snapping unless Shift is held
				if (e.shiftKey) {
					setSize({ width: newWidth, height: newHeight });
					setPosition(newPos);
					onResize?.({ width: newWidth, height: newHeight }, newPos);
				} else {
					const snapped = snapSize(
						{ width: newWidth, height: newHeight },
						newPos,
					);
					setSize(snapped.size);
					setPosition(snapped.pos);
					onResize?.(snapped.size, snapped.pos);
				}
			} else if (isRotating) {
				// Calculate element center
				const centerX = position.x + size.width / 2;
				const centerY = position.y + size.height / 2;

				// Calculate current angle from center to mouse
				const currentAngle = Math.atan2(mouseY - centerY, mouseX - centerX);
				const currentDegrees = currentAngle * (180 / Math.PI);

				// Calculate the difference from the starting angle
				const angleDiff = currentDegrees - startAngle.current;

				// Add the difference to the starting rotation
				let newRotation = startRotation.current + angleDiff;

				// Apply rotation snapping unless Shift is held
				if (!e.shiftKey) {
					newRotation = snapRotation(newRotation);
				}

				setRotation(newRotation);
				onRotate?.(newRotation);
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
		applySnapping,
		snapRotation,
		snapSize,
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
