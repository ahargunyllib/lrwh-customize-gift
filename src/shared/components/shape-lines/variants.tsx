import type { LineElement } from "@/shared/types/element/line";
import type { ShapeElement } from "@/shared/types/element/shape";
import { Circle, Square } from "lucide-react";

export interface ShapeVariant {
	variant: ShapeElement["variant"];
	name: string;
	description: string;
	icon: React.ReactNode;
}
export const shapeVariants: ShapeVariant[] = [
	{
		variant: "circle",
		name: "Circle",
		description: "",
		icon: <Circle className="w-5 h-5 text-gray-700" />,
	},
	{
		variant: "rectangle",
		name: "Rectangle",
		description: "",
		icon: <Square className="w-5 h-5 text-gray-700" />,
	},
];

export interface LineVariant {
	variant: LineElement["variant"];
	name: string;
	description: string;
	preview: React.ReactNode;
}
export const lineVariants: LineVariant[] = [
	{
		variant: "line-thin",
		name: "Thin Line",
		description: "1px solid line",
		preview: <div className="w-12 h-0.5 bg-gray-700" />,
	},
	{
		variant: "line-medium",
		name: "Medium Line",
		description: "2px solid line",
		preview: <div className="w-12 h-1 bg-gray-700" />,
	},
	{
		variant: "line-thick",
		name: "Thick Line",
		description: "4px solid line",
		preview: <div className="w-12 h-1.5 bg-gray-700" />,
	},
	{
		variant: "line-dashed",
		name: "Dashed Line",
		description: "2px dashed line",
		preview: (
			<div className="w-12 h-0.5 border-t-2 border-dashed border-gray-700" />
		),
	},
	{
		variant: "line-dotted",
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
		variant: "line-arrow",
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
		variant: "line-rounded",
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
	variant: ShapeElement["variant"] | LineElement["variant"],
) => {
	if (variant?.startsWith("line-")) {
		const lineVariant = lineVariants.find((v) => v.variant === variant);
		return lineVariant?.preview ?? <div className="w-4 h-0.5 bg-current" />;
	}

	const shapeVariant = shapeVariants.find((v) => v.variant === variant);
	return shapeVariant?.icon ?? <Square className="w-4 h-4 text-current" />;
};
