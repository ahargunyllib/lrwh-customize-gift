import { useTemplateContext } from "@/features/editor/containers/template-creator";
import type { LineElement } from "@/shared/types/element/line";
import type { ShapeElement } from "@/shared/types/element/shape";
import type { ImageElement, TextElement } from "@/shared/types/template";
import {
	ArrowDown,
	ArrowDownToLine,
	ArrowUp,
	ArrowUpToLine,
} from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
	BorderWidthControl,
	ColorControls,
	OpacityControl,
	PositionControls,
	RotationControl,
	SizeControls,
} from "../controls";

/**
 * Renders a set of controls for editing properties of a shape element and forwards incremental updates.
 *
 * The component shows controls for position, size, border radius, rotation, fill/border colors,
 * border width, opacity, and z-index. User interactions produce partial updates that are passed
 * to `onUpdate` so the caller can merge and persist changes.
 *
 * @param shape - The ShapeElement being edited.
 * @param onUpdate - Callback invoked with partial ShapeElement updates (e.g., `{ position }`, `{ width, height }`, `{ borderRadius }`).
 * @returns A React element containing the configured controls.
 */
export default function ShapeConfigurator({
	shape,
	onUpdate,
}: {
	shape: ShapeElement;
	onUpdate: (updates: Partial<ShapeElement>) => void;
}) {
	return (
		<div className="space-y-4">
			<PositionControls
				position={shape.position}
				onChange={(position) => onUpdate({ position })}
			/>
			<SizeControls
				width={shape.width}
				height={shape.height}
				onChange={(size) => onUpdate(size)}
			/>
			<div className="space-y-2">
				<Label className="text-xs font-medium">
					Border Radius ({shape.borderRadius}px)
				</Label>
				<Input
					type="number"
					value={shape.borderRadius}
					onChange={(e) =>
						onUpdate({ borderRadius: Number.parseFloat(e.target.value) })
					}
					min={0}
					max={100}
					step={1}
					className="w-full"
					placeholder="Enter border radius"
				/>
			</div>
			<RotationControl
				rotation={shape.rotation}
				onChange={(rotation) => onUpdate({ rotation })}
			/>
			<ColorControls
				fill={shape.fill}
				borderColor={shape.borderColor}
				shapeId={shape.id}
				onChange={(colors) => onUpdate(colors)}
			/>
			<BorderWidthControl
				borderWidth={shape.borderWidth}
				onChange={(borderWidth) => onUpdate({ borderWidth })}
			/>
			<OpacityControl
				opacity={shape.opacity}
				onChange={(opacity) => onUpdate({ opacity })}
			/>
			<ZIndexControls element={shape} />
		</div>
	);
}

/**
 * UI controls for adjusting an element's z-order within the template layer stack.
 *
 * Renders four buttons to move the provided element forward, backward, to front, or to back.
 * Each control is disabled when the element is already at the corresponding extreme (top/bottom).
 *
 * @param element - The element (LineElement | ShapeElement | ImageElement | TextElement) whose layer position will be changed.
 * @returns A React element containing the Z-index controls.
 */
export function ZIndexControls({
	element,
}: {
	element: LineElement | ShapeElement | ImageElement | TextElement;
}) {
	const {
		bringForwardLayer,
		sendBackwardLayer,
		bringToFrontLayer,
		sendToBackLayer,
		getLayerIndex,
		getLayerLength,
		isOnTopLayer,
		isOnBottomLayer,
	} = useTemplateContext();
	// normalize zIndex for backward compatibility
	const currentZIndex = getLayerIndex(element.id);
	const totalElement = getLayerLength();
	return (
		<div>
			<Label className="text-xs font-medium">Z Index</Label>
			<div className="flex flex-wrap gap-2 mt-1">
				<Button
					variant="outline"
					size="sm"
					className="h-7 text-xs"
					disabled={isOnTopLayer(element.id)}
					onClick={(e) => {
						e.stopPropagation();
						bringForwardLayer(element.id);
					}}
				>
					<ArrowUp className="w-4 h-4 mr-1" />
					Forward
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="h-7 text-xs"
					disabled={isOnBottomLayer(element.id)}
					onClick={(e) => {
						e.stopPropagation();
						sendBackwardLayer(element.id);
					}}
				>
					<ArrowDown className="w-4 h-4 mr-1" />
					Backward
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="h-7 text-xs"
					disabled={isOnTopLayer(element.id)}
					onClick={(e) => {
						e.stopPropagation();
						bringToFrontLayer(element.id);
					}}
				>
					<ArrowUpToLine className="w-4 h-4 mr-1" />
					To Front
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="h-7 text-xs"
					disabled={isOnBottomLayer(element.id)}
					onClick={(e) => {
						e.stopPropagation();
						sendToBackLayer(element.id);
					}}
				>
					<ArrowDownToLine className="w-4 h-4 mr-1" />
					To Back
				</Button>
			</div>
		</div>
	);
}
