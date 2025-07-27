import { Label } from "@/shared/components/ui/label";
import { Slider } from "@/shared/components/ui/slider";
import type { ShapeElement } from "@/shared/types/element/shape";

export default function RotationControl({
	rotation,
	onChange,
}: {
	rotation: ShapeElement["rotation"];
	onChange: (rotation: number) => void;
}) {
	return (
		<div className="space-y-2">
			<Label className="text-xs font-medium">Rotation ({rotation}°)</Label>
			<Slider
				value={[rotation]}
				onValueChange={(value) => onChange(value[0])}
				max={360}
				min={0}
				step={1}
				className="w-full"
			/>
		</div>
	);
}
