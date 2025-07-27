import { useTemplateContext as useTemplateCreatorCtx } from "@/features/editor/containers/template-creator";
import { Plus } from "lucide-react";
import { lineVariants } from "../variants";

export default function LineSelector() {
	const { addLine } = useTemplateCreatorCtx();

	return (
		<div className="space-y-1.5">
			{lineVariants.map((variant) => (
				// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
				<div
					key={variant.type}
					className="rounded-md cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-200"
					onClick={() => {
						addLine(variant.type);
					}}
				>
					<div className="flex items-center gap-4 p-1">
						<div className="flex-shrink-0 w-16 h-8 flex items-center justify-center bg-gray-200 rounded">
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
	);
}
