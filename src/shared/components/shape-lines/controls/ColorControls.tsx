import type { ShapeElement } from "@/shared/types/element/shape";
import ColorPicker from "./ColorPicker";

export default function ColorControls({
	fill,
	borderColor,
	shapeId,
	onChange,
}: {
	fill: ShapeElement["fill"];
	borderColor: ShapeElement["borderColor"];
	shapeId: ShapeElement["id"];
	onChange: (colors: {
		fill?: ShapeElement["fill"];
		borderColor?: ShapeElement["borderColor"];
	}) => void;
}) {
	return (
		<div className="space-y-3">
			<ColorPicker
				label="Fill Color"
				value={fill}
				id={`fill-${shapeId}`}
				onChange={(fill) => onChange({ fill })}
			/>
			<ColorPicker
				label="Border Color"
				value={borderColor}
				id={`border-${shapeId}`}
				onChange={(borderColor) => onChange({ borderColor })}
			/>
		</div>
	);
}
