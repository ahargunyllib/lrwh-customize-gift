import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import type { ShapeElement } from "@/shared/types/element/shape";

export default function ColorPicker({
	label,
	value,
	id,
	onChange,
}: {
	label: string;
	value: string;
	id: string;
	onChange: (color: ShapeElement["fill"]) => void;
}) {
	return (
		<div className="space-y-2">
			<Label className="text-xs font-medium">{label}</Label>
			<div className="flex items-center gap-2">
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
				<div
					className="w-6 h-6 border rounded cursor-pointer"
					style={{ backgroundColor: value }}
					onClick={() => document.getElementById(id)?.click()}
				/>
				<input
					id={id}
					type="color"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="sr-only"
				/>
				<Input
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="flex-1 h-8 text-sm"
				/>
			</div>
		</div>
	);
}
