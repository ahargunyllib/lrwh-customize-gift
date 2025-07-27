import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import type { ShapeElement } from "@/shared/types/element/shape";

export default function SizeControls({
	width,
	height,
	onChange,
}: {
	width: ShapeElement["width"];
	height: ShapeElement["height"];
	onChange: (size: {
		width: ShapeElement["width"];
		height: ShapeElement["height"];
	}) => void;
}) {
	return (
		<div className="grid grid-cols-2 gap-3">
			<div className="space-y-2">
				<Label className="text-xs font-medium">Width</Label>
				<Input
					type="number"
					value={width}
					onChange={(e) => onChange({ width: Number(e.target.value), height })}
					className="h-8 text-sm"
				/>
			</div>
			<div className="space-y-2">
				<Label className="text-xs font-medium">Height</Label>
				<Input
					type="number"
					value={height}
					onChange={(e) => onChange({ height: Number(e.target.value), width })}
					className="h-8 text-sm"
				/>
			</div>
		</div>
	);
}
