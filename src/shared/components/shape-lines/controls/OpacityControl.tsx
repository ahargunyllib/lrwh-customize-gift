import { Label } from "@/shared/components/ui/label";
import { Slider } from "@/shared/components/ui/slider";
import type { ShapeElement } from "@/shared/types/element/shape";

export default function OpacityControl({
	opacity,
	onChange,
}: {
	opacity: ShapeElement["opacity"];
	onChange: (opacity: number) => void;
}) {
	return (
		<div className="space-y-2">
			<Label className="text-xs font-medium">Opacity ({opacity}%)</Label>
			<Slider
				value={[opacity]}
				onValueChange={(value) => onChange(value[0])}
				max={100}
				min={0}
				step={1}
				className="w-full"
			/>
		</div>
	);
}
