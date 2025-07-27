import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import type { ShapeElement } from "@/shared/types/element/shape";

export default function PositionControls({
	position,
	onChange,
}: {
	position: ShapeElement["position"];
	onChange: (position: ShapeElement["position"]) => void;
}) {
	return (
		<div className="grid grid-cols-2 gap-3">
			<div className="space-y-2">
				<Label className="text-xs font-medium">X Position</Label>
				<Input
					type="number"
					value={position.x}
					onChange={(e) =>
						onChange({
							x: Number(e.target.value),
							y: position.y,
						})
					}
					className="h-8 text-sm"
				/>
			</div>
			<div className="space-y-2">
				<Label className="text-xs font-medium">Y Position</Label>
				<Input
					type="number"
					value={position.y}
					onChange={(e) =>
						onChange({
							x: position.x,
							y: Number(e.target.value),
						})
					}
					className="h-8 text-sm"
				/>
			</div>
		</div>
	);
}
