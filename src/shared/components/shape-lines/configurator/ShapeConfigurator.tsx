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
