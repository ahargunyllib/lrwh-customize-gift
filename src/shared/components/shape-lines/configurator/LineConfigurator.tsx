import {
	LINE_TIP,
	type LineElement,
	type LineTip,
} from "@/shared/types/element/line";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../ui/select";
import { OpacityControl } from "../controls";
import ColorPicker from "../controls/ColorPicker";
import { ZIndexControls } from "./ShapeConfigurator";

/**
 * UI for configuring a LineElement's visual and positional properties.
 *
 * Renders controls to edit the line's start/end positions, color, opacity, z-index,
 * tip types, and stroke width. User changes are propagated via the `onUpdate`
 * callback as partial updates to the provided `line`.
 *
 * @param line - The LineElement being edited; initial control values are derived from this object.
 * @param onUpdate - Callback invoked with partial updates to the LineElement when any control changes.
 * @param totalElement - Currently unused; preserved for compatibility with the configurator props shape.
 * @returns A JSX element containing the configured controls.
 */
export default function LineConfigurator({
	line,
	onUpdate,
	totalElement,
}: {
	line: LineElement;
	onUpdate: (updates: Partial<LineElement>) => void;
	totalElement: number;
}) {
	return (
		<div className="space-y-4">
			<LinePositionControls
				startX={line.startPoint.x}
				startY={line.startPoint.y}
				endX={line.endPoint.x}
				endY={line.endPoint.y}
				onChange={(position) =>
					onUpdate({
						startPoint: { x: position.startX, y: position.startY },
						endPoint: { x: position.endX, y: position.endY },
					})
				}
			/>
			<ColorPicker
				label="Line Color"
				value={line.strokeColor}
				id={`line-color-${line.id}`}
				onChange={(color) => onUpdate({ strokeColor: color })}
			/>
			<OpacityControl
				opacity={line.opacity}
				onChange={(opacity) => onUpdate({ opacity })}
			/>
			<ZIndexControls element={line} />
			<LineTipControls
				startTip={line.startTip}
				endTip={line.endTip}
				onChange={onUpdate}
			/>
			<LineWidthControls
				strokeWidth={line.strokeWidth}
				onUpdate={(strokeWidth) => onUpdate({ strokeWidth })}
			/>
		</div>
	);
}

function LineTipControls({
	startTip,
	endTip,
	onChange,
}: {
	startTip: LineTip | undefined;
	endTip: LineTip | undefined;
	onChange: (updates: Partial<LineElement>) => void;
}) {
	return (
		<div className="space-y-2">
			{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
			<label className="text-xs font-medium">Line Tip</label>
			<div className="flex gap-x-2">
				<Select
					value={startTip}
					onValueChange={(value) => onChange({ startTip: value as LineTip })}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select a line tip" />
					</SelectTrigger>
					<SelectContent>
						{Object.entries(LINE_TIP).map(([key, value]) => (
							<SelectItem key={key} value={value}>
								{key}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select
					value={endTip}
					onValueChange={(value) => onChange({ endTip: value as LineTip })}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select a line tip" />
					</SelectTrigger>
					<SelectContent>
						{Object.entries(LINE_TIP).map(([key, value]) => (
							<SelectItem key={key} value={value}>
								{key}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
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
				{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
				<label className="text-xs font-medium">X</label>
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
				{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
				<label className="text-xs font-medium">Y</label>
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
				{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
				<label className="text-xs font-medium">X</label>
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
				{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
				<label className="text-xs font-medium">Y</label>
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

function LineWidthControls({
	strokeWidth,
	onUpdate,
}: {
	strokeWidth: number;
	onUpdate: (strokeWidth: number) => void;
}) {
	return (
		<div className="space-y-2">
			{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
			<label className="text-xs font-medium">Line Width</label>
			<Input
				type="number"
				value={strokeWidth}
				onChange={(e) => onUpdate(Number.parseFloat(e.target.value))}
				min={1}
				max={100}
				step={1}
				className="w-full"
				placeholder="Enter line width"
			/>
		</div>
	);
}
