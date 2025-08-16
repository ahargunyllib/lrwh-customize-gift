import { Label } from "@/shared/components/ui/label";
import { Slider } from "@/shared/components/ui/slider";
import type { ShapeElement } from "@/shared/types/element/shape";

export default function BorderWidthControl({
	borderWidth,
	onChange,
}: {
	borderWidth: ShapeElement["borderWidth"];
	onChange: (borderWidth: number) => void;
}) {
	return (
		<div className="space-y-2">
			<Label className="text-xs font-medium">
				Border Width ({borderWidth}px)
			</Label>
			<Slider
				value={[borderWidth]}
				onValueChange={(value) => onChange(value[0])}
				max={10}
				min={0}
				step={1}
				className="w-full"
			/>
		</div>
	);
}
