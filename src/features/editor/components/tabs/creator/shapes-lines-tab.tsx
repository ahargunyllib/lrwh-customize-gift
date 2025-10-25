import { useTemplateContext } from "@/features/editor/containers/template-creator";
import LineConfigurator from "@/shared/components/shape-lines/configurator/LineConfigurator";
import ShapeConfigurator from "@/shared/components/shape-lines/configurator/ShapeConfigurator";
import LineSelector from "@/shared/components/shape-lines/selector/LineSelector";
import ShapeSelector from "@/shared/components/shape-lines/selector/ShapeSelector";
import { getShapeIcon } from "@/shared/components/shape-lines/variants";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { buttonVariants } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/components/ui/tabs";
import { useScrollToActive } from "@/shared/hooks/use-scroll-to-active";
import { cn } from "@/shared/lib/utils";
import type { LineElement } from "@/shared/types/element/line";
import type { ShapeElement } from "@/shared/types/element/shape";
import { Minus, Square, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type TabValue = "shape" | "line";

export default function ShapesLinesTab() {
	const tabsContentList = [
		{
			value: "shape",
			comp: ShapeTabContent,
		},
		{
			value: "line",
			comp: LinesTabContent,
		},
	];

	const { activeElement } = useTemplateContext();

	const incomingTab: TabValue = useMemo(
		() => (activeElement?.type === "shape" ? "shape" : "line"),
		[activeElement?.type],
	);
	const [tab, setTab] = useState<TabValue>(incomingTab);

	useEffect(() => {
		setTab(incomingTab);
	}, [incomingTab]);

	return (
		<div className="mt-6">
			<Tabs
				value={tab}
				className="w-full"
				onValueChange={(v) => setTab(v as TabValue)}
			>
				<TabsList className="">
					<TabsTrigger value="shape">
						<Square className="h-4 w-4 mr-1" />
						Shapes
					</TabsTrigger>
					<TabsTrigger value="line">
						<Minus className="h-4 w-4 mr-1" />
						Lines
					</TabsTrigger>
				</TabsList>

				{tabsContentList.map((tab) => (
					<TabsContent key={tab.value} value={tab.value}>
						<tab.comp />
					</TabsContent>
				))}
			</Tabs>
		</div>
	);
}

function LinesTabContent() {
	const {
		template,
		updateLine,
		deleteElement,
		activeElement,
		setActiveElement,
		totalElements,
	} = useTemplateContext();
	const lines = template.lines;

	const activeLineId = useMemo(
		() => (activeElement?.type === "line" ? activeElement.id : undefined),
		[activeElement],
	);

	const { getRef } = useScrollToActive({
		activeId: activeLineId,
		deps: [template.lines.length],
	});
	return (
		<>
			<LineSelector />
			{lines?.length > 0 && (
				<div className="space-y-3 pt-4 border-t">
					<div className="flex items-center justify-between">
						<Label className="text-sm font-medium">Added Lines</Label>
						<span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
							{lines.length} {lines.length === 1 ? "item" : "items"}
						</span>
					</div>

					<Accordion
						type="single"
						className="space-y-2"
						collapsible
						value={activeElement?.id || undefined}
						onValueChange={(value) =>
							setActiveElement({ id: value, type: "line" })
						}
					>
						{lines.map((line, idx) => (
							<AccordionItem
								ref={getRef(line.id)}
								key={line.id}
								value={line.id}
								className={cn(
									"border-2 last:border-b-2 rounded-md",
									activeElement?.id === line.id && "border-black",
								)}
								onClick={(e) => {
									e.stopPropagation();
									setActiveElement({ id: line.id, type: "line" });
								}}
							>
								<div>
									<AccordionTrigger className="p-2 gap-1">
										<ElementAccordionTrigger
											element={line}
											index={idx}
											type="Line"
											onDelete={() => deleteElement(line.id)}
										/>
									</AccordionTrigger>
									<AccordionContent className="px-4 pb-4">
										<LineConfigurator
											line={line}
											onUpdate={(updates) => updateLine(line.id, updates)}
											totalElement={totalElements}
										/>
									</AccordionContent>
								</div>
							</AccordionItem>
						))}
					</Accordion>
				</div>
			)}
		</>
	);
}

function ShapeTabContent() {
	const {
		template,
		deleteElement,
		updateShape,
		activeElement,
		setActiveElement,
		totalElements,
	} = useTemplateContext();
	const shapes = template.shapes;

	const activeShapeId = useMemo(
		() => (activeElement?.type === "shape" ? activeElement.id : undefined),
		[activeElement],
	);

	const { getRef } = useScrollToActive({
		activeId: activeShapeId,
		deps: [template.shapes.length],
	});

	return (
		<>
			<ShapeSelector />
			{shapes?.length > 0 && (
				<div className="space-y-3 pt-4 border-t">
					<div className="flex items-center justify-between">
						<Label className="text-sm font-medium">Added Elements</Label>
						<span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
							{shapes.length} {shapes.length === 1 ? "item" : "items"}
						</span>
					</div>

					<Accordion
						type="single"
						collapsible
						className="space-y-2"
						value={activeElement?.id || undefined}
						onValueChange={(value) =>
							setActiveElement({ id: value, type: "shape" })
						}
					>
						{shapes.map((shape, idx) => (
							<AccordionItem
								ref={getRef(shape.id)}
								key={shape.id}
								value={shape.id}
								className={cn(
									"border-2 last:border-b-2 rounded-md",
									activeElement?.id === shape.id && "border-black",
								)}
								onClick={(e) => {
									e.stopPropagation();
									setActiveElement({ id: shape.id, type: "shape" });
								}}
							>
								<div>
									<AccordionTrigger className="p-2 gap-1">
										<ElementAccordionTrigger
											element={shape}
											index={idx}
											type="Shape"
											onDelete={() => deleteElement(shape.id)}
										/>
									</AccordionTrigger>
									<AccordionContent className="px-4 pb-4">
										<ShapeConfigurator
											shape={shape}
											onUpdate={(updates) => updateShape(shape.id, updates)}
										/>
									</AccordionContent>
								</div>
							</AccordionItem>
						))}
					</Accordion>
				</div>
			)}
		</>
	);
}

type ElementAccordionTriggerProps = {
	element: LineElement | ShapeElement;
	index: number;
	type: string;
	onDelete: () => void;
};

function ElementAccordionTrigger({
	element,
	index,
	type,
	onDelete,
}: ElementAccordionTriggerProps) {
	return (
		<div className="flex items-center gap-3 flex-1">
			<div className="flex-shrink-0 w-8 h-6 flex items-center justify-center">
				{getShapeIcon(element.variant)}
			</div>
			<div className="flex-1 text-left">
				<span className="font-medium text-sm">
					{type} {index + 1}
				</span>
			</div>
			<div className="flex items-center gap-2 mr-2">
				<div
					className="w-4 h-4 rounded border"
					style={{
						backgroundColor:
							"strokeColor" in element ? element.strokeColor : element.fill,
					}}
				/>
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
				<span
					className={cn(
						buttonVariants({ variant: "ghost", size: "sm" }),
						"p-1 h-6 w-6 text-red-500 hover:text-red-700",
					)}
					onClick={(e) => {
						e.stopPropagation();
						onDelete();
					}}
				>
					<Trash2 className="w-3 h-3" />
				</span>
			</div>
		</div>
	);
}
