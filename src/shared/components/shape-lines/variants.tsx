import type { LineElement } from "@/shared/types/element/line";
import type { ShapeElement } from "@/shared/types/element/shape";
import { Circle, Square } from "lucide-react";

export interface ShapeVariant {
	type: ShapeElement["type"];
	name: string;
	description: string;
	icon: React.ReactNode;
}
export const shapeVariants: ShapeVariant[] = [
	{
		type: "circle",
		name: "Circle",
		description: "",
		icon: <Circle className="w-5 h-5 text-gray-700" />,
	},
	{
		type: "rectangle",
		name: "Rectangle",
		description: "",
		icon: <Square className="w-5 h-5 text-gray-700" />,
	},
];

export interface LineVariant {
	type: LineElement["type"];
	name: string;
	description: string;
	preview: React.ReactNode;
}
export const lineVariants: LineVariant[] = [
	{
		type: "line-thin",
		name: "Thin Line",
		description: "1px solid line",
		preview: <div className="w-12 h-0.5 bg-gray-700" />,
	},
	{
		type: "line-medium",
		name: "Medium Line",
		description: "2px solid line",
		preview: <div className="w-12 h-1 bg-gray-700" />,
	},
	{
		type: "line-thick",
		name: "Thick Line",
		description: "4px solid line",
		preview: <div className="w-12 h-1.5 bg-gray-700" />,
	},
	{
		type: "line-dashed",
		name: "Dashed Line",
		description: "2px dashed line",
		preview: (
			<div className="w-12 h-0.5 border-t-2 border-dashed border-gray-700" />
		),
	},
	{
		type: "line-dotted",
		name: "Dotted Line",
		description: "2px dotted line",
		preview: (
			<div className="flex gap-1 items-center">
				{[...Array(6)].map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
					<div key={i} className="w-1 h-1 bg-gray-700 rounded-full" />
				))}
			</div>
		),
	},
	{
		type: "line-arrow",
		name: "Arrow Line",
		description: "Line with arrow",
		preview: (
			<div className="flex items-center">
				<div className="w-10 h-0.5 bg-gray-700" />
				<div className="w-0 h-0 border-l-[6px] border-l-gray-700 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent" />
			</div>
		),
	},
	{
		type: "line-rounded",
		name: "Rounded Line",
		description: "Line with rounded tips",
		preview: (
			<div className="flex items-center">
				<div className="w-10 h-0.5 bg-gray-700" />
			</div>
		),
	},
];

export const getShapeIcon = (
	type: ShapeElement["type"] | LineElement["type"],
) => {
	if (type.startsWith("line-")) {
		const variant = lineVariants.find((v) => v.type === type);
		return variant?.preview ?? <div className="w-4 h-0.5 bg-current" />;
	}

	const variant = shapeVariants.find((v) => v.type === type);
	return variant?.icon ?? <Square className="w-4 h-4 text-current" />;
};
