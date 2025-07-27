import type { ShapeElement } from "@/shared/types/element/shape";
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
		</div>
	);
}
