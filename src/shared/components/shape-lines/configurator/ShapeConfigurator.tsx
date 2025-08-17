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
	totalElement,
}: {
	shape: ShapeElement;
	onUpdate: (updates: Partial<ShapeElement>) => void;
	totalElement: number;
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
			<ZIndexControls
				element={shape}
				onUpdate={(zIndex) => onUpdate({ zIndex })}
				totalElement={totalElement}
			/>
		</div>
	);
}

export function ZIndexControls({
	element,
	onUpdate,
	totalElement,
}: {
	element: LineElement | ShapeElement | ImageElement | TextElement;
	onUpdate: (updates: number) => void;
	totalElement: number;
}) {
	// normalize zIndex for backward compatibility
	const currentZIndex = element.zIndex ?? 1;

	const bringForward = () => {
		if (currentZIndex >= totalElement) return;
		onUpdate(currentZIndex + 1);
	};

	const sendBackward = () => {
		if (currentZIndex <= 1) return;
		onUpdate(currentZIndex - 1);
	};

	const bringToFront = () => {
		if (currentZIndex === totalElement) return;
		onUpdate(totalElement);
	};

	const sendToBack = () => {
		if (currentZIndex === 1) return;
		onUpdate(1);
	};

	return (
		<div>
			<Label className="text-xs font-medium">Z Index</Label>
			<div className="flex flex-wrap gap-2 mt-1">
				<Button
					variant="outline"
					size="sm"
					className="h-7 text-xs"
					disabled={currentZIndex >= totalElement}
					onClick={(e) => {
						e.stopPropagation();
						bringForward();
					}}
				>
					<ArrowUp className="w-4 h-4 mr-1" />
					Forward
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="h-7 text-xs"
					disabled={currentZIndex <= 1}
					onClick={(e) => {
						e.stopPropagation();
						sendBackward();
					}}
				>
					<ArrowDown className="w-4 h-4 mr-1" />
					Backward
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="h-7 text-xs"
					disabled={currentZIndex >= totalElement}
					onClick={(e) => {
						e.stopPropagation();
						bringToFront();
					}}
				>
					<ArrowUp className="w-4 h-4 mr-1" />
					To Front
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="h-7 text-xs"
					disabled={currentZIndex <= 1}
					onClick={(e) => {
						e.stopPropagation();
						sendToBack();
					}}
				>
					<ArrowDown className="w-4 h-4 mr-1" />
					To Back
				</Button>
			</div>
		</div>
	);
}
