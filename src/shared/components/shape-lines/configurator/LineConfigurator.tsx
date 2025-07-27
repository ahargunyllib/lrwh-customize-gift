import type { LineElement } from "@/shared/types/element/line";
import { Input } from "../../ui/input";
import { OpacityControl, RotationControl } from "../controls";
import ColorPicker from "../controls/ColorPicker";

export default function LineConfigurator({
	line,
	onUpdate,
}: {
	line: LineElement;
	onUpdate: (updates: Partial<LineElement>) => void;
}) {
	return (
		<div className="space-y-4">
			<LinePositionControls
				startX={line.startX}
				startY={line.startY}
				endX={line.endX}
				endY={line.endY}
				onChange={(position) => onUpdate({})}
			/>
			<ColorPicker
				label="Line Color"
				value={line.strokeColor}
				id={`line-color-${line.id}`}
				onChange={(color) => onUpdate({ strokeColor: color })}
			/>
			<RotationControl
				rotation={line.rotation}
				onChange={(rotation) => onUpdate({ rotation })}
			/>
			<OpacityControl
				opacity={line.opacity}
				onChange={(opacity) => onUpdate({ opacity })}
			/>
		</div>
	);
}

// start x y end x y controls
function LinePositionControls({
	startX,
	startY,
	endX,
	endY,
	onChange,
}: {
	startX: number;
	startY: number;
	endX: number;
	endY: number;
	onChange: (position: {
		startX: number;
		startY: number;
		endX: number;
		endY: number;
	}) => void;
}) {
	return (
		<div className="space-y-2">
			{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
			<label className="text-xs font-medium">Start Position</label>
			<div className="flex space-x-2">
				<Input
					type="number"
					value={startX}
					onChange={(e) =>
						onChange({
							startX: Number.parseFloat(e.target.value),
							startY,
							endX,
							endY,
						})
					}
					placeholder="Start X"
				/>
				<Input
					type="number"
					value={startY}
					onChange={(e) =>
						onChange({
							startX,
							startY: Number.parseFloat(e.target.value),
							endX,
							endY,
						})
					}
					placeholder="Start Y"
				/>
			</div>
			{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
			<label className="text-xs font-medium">End Position</label>
			<div className="flex space-x-2">
				<Input
					type="number"
					value={endX}
					onChange={(e) =>
						onChange({
							startX,
							startY,
							endX: Number.parseFloat(e.target.value),
							endY,
						})
					}
					placeholder="End X"
				/>
				<Input
					type="number"
					value={endY}
					onChange={(e) =>
						onChange({
							startX,
							startY,
							endX,
							endY: Number.parseFloat(e.target.value),
						})
					}
					placeholder="End Y"
				/>
			</div>
		</div>
	);
}
