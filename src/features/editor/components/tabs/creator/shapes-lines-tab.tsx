import { useTemplateContext } from "@/features/editor/containers/template-creator";
import { Accordion } from "@/shared/components/ui/accordion";
import { Label } from "@/shared/components/ui/label";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/components/ui/tabs";
import type { LineElement } from "@/shared/types/element/line";
import type { ShapeElement } from "@/shared/types/element/shape";
import { Circle, Minus, Plus, Square } from "lucide-react";

export default function ShapesTab() {
	const addLine = (type: LineElement["type"]) => {};

	return (
		<div className="mt-6">
			<Tabs defaultValue="shapes" className="w-full">
				<TabsList className="">
					<TabsTrigger value="shapes">
						<Square className="h-4 w-4 mr-1" />
						Shapes
					</TabsTrigger>
					<TabsTrigger value="lines">
						<Minus className="h-4 w-4 mr-1" />
						Lines
					</TabsTrigger>
				</TabsList>

				<ShapeTabsContent />
				<TabsContent value="lines">
					<div className="space-y-1.5">
						{lineVariants.map((variant) => (
							// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
							<div
								key={variant.type}
								className="rounded-md cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-200"
								onClick={() => addLine(variant.type)}
							>
								<div className="flex items-center gap-4 p-1">
									<div className="flex-shrink-0 w-16 h-8 flex items-center justify-center bg-gray-50 rounded">
										{variant.preview}
									</div>
									<div className="flex-1 min-w-0">
										<h4 className="font-medium text-sm text-gray-900">
											{variant.name}
										</h4>
										<p className="text-xs text-gray-500 mt-0.5">
											{variant.description}
										</p>
									</div>
									<Plus className="w-5 h-5 text-gray-400" />
								</div>
							</div>
						))}
					</div>
				</TabsContent>
			</Tabs>

			{/* Template Line and Shapes render */}
		</div>
	);
}

function ShapeTabsContent() {
	const { template, addShape, activeElement, setActiveElement } =
		useTemplateContext();

	const shapesTemplate = template.shapes;
	return (
		<TabsContent value="shapes">
			<div className="space-y-1.5">
				{shapeVariants.map((variant) => (
					// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
					<div
						key={variant.type}
						className="rounded-md cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-200"
						onClick={() => addShape(variant.type)}
					>
						<div className="flex items-center gap-4 p-1">
							<div className="flex-shrink-0 w-16 h-8 flex items-center justify-center bg-gray-200 rounded">
								{variant.icon}
							</div>
							<div className="flex-1 min-w-0">
								<h4 className="font-medium text-sm text-gray-900">
									{variant.name}
								</h4>
								<p className="text-xs text-gray-500 mt-0.5">
									{variant.description}
								</p>
							</div>
							<Plus className="w-5 h-5 text-gray-400" />
						</div>
					</div>
				))}
			</div>
			{shapesTemplate?.length > 0 && (
				<div className="space-y-3 pt-4 border-t">
					<div className="flex items-center justify-between">
						<Label className="text-sm font-medium">Added Elements</Label>
						<span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
							{shapesTemplate.length}{" "}
							{shapesTemplate.length === 1 ? "item" : "items"}
						</span>
					</div>

					<Accordion
						type="single"
						collapsible
						className="space-y-2"
					></Accordion>
				</div>
			)}
		</TabsContent>
	);
}

interface LineVariant {
	type: LineElement["type"];
	name: string;
	description: string;
	preview: React.ReactNode;
}
const lineVariants: LineVariant[] = [
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
];

interface ShapeVariant {
	type: ShapeElement["type"];
	name: string;
	description: string;
	icon: React.ReactNode;
}
const shapeVariants: ShapeVariant[] = [
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
	// {
	//   type: "triangle",
	//   name: "Triangle",
	//   description: "",
	//   icon: <Triangle className="w-5 h-5 text-gray-700" />,
	// },
];
