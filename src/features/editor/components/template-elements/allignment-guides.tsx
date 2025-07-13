"use client";

import type { Guide } from "../../hooks/use-allignment-guides";

interface AlignmentGuidesProps {
	scale: number;
	guides: Guide[];
	canvasWidth: number;
	canvasHeight: number;
}

const guideStyles: Record<Guide["type"], { color: string; shadow: string }> = {
	centerX: { color: "bg-blue-500", shadow: "0 0 2px rgba(59, 130, 246, 0.8)" },
	centerY: { color: "bg-blue-500", shadow: "0 0 2px rgba(59, 130, 246, 0.8)" },
	centerToCenterX: {
		color: "bg-purple-500",
		shadow: "0 0 2px rgba(168, 85, 247, 0.8)",
	},
	centerToCenterY: {
		color: "bg-purple-500",
		shadow: "0 0 2px rgba(168, 85, 247, 0.8)",
	},
	alignLeft: {
		color: "bg-green-500",
		shadow: "0 0 2px rgba(34, 197, 94, 0.8)",
	},
	alignRight: {
		color: "bg-green-500",
		shadow: "0 0 2px rgba(34, 197, 94, 0.8)",
	},
	alignTop: { color: "bg-green-500", shadow: "0 0 2px rgba(34, 197, 94, 0.8)" },
	alignBottom: {
		color: "bg-green-500",
		shadow: "0 0 2px rgba(34, 197, 94, 0.8)",
	},
};

export default function AlignmentGuides({
	scale,
	guides,
	canvasWidth,
	canvasHeight,
}: AlignmentGuidesProps) {
	const renderGuide = (guide: Guide, index: number) => {
		const { color, shadow } = guideStyles[guide.type];

		switch (guide.type) {
			case "centerX":
			case "alignLeft":
			case "alignRight":
				return (
					<div
						key={`${guide.type}-${index}`}
						className={`absolute top-0 bottom-0 w-px ${color}`}
						style={{
							left: guide.position * scale,
							boxShadow: shadow,
						}}
					/>
				);

			case "centerY":
			case "alignTop":
			case "alignBottom":
				return (
					<div
						key={`${guide.type}-${index}`}
						className={`absolute left-0 right-0 h-px ${color}`}
						style={{
							top: guide.position * scale,
							boxShadow: shadow,
						}}
					/>
				);

			case "centerToCenterX":
				return (
					<div
						key={`${guide.type}-${index}`}
						className={`absolute w-px ${color}`}
						style={{
							left: guide.position * scale,
							top: (guide.startPosition ?? 0) * scale,
							height:
								guide.endPosition && guide.startPosition
									? (guide.endPosition - guide.startPosition) * scale
									: canvasHeight,
							boxShadow: shadow,
						}}
					/>
				);

			case "centerToCenterY":
				return (
					<div
						key={`${guide.type}-${index}`}
						className={`absolute h-px ${color}`}
						style={{
							top: guide.position * scale,
							left: (guide.startPosition ?? 0) * scale,
							width:
								guide.endPosition && guide.startPosition
									? (guide.endPosition - guide.startPosition) * scale
									: canvasWidth,
							boxShadow: shadow,
						}}
					/>
				);

			default:
				return null;
		}
	};

	return (
		<div className="absolute inset-0 pointer-events-none z-0">
			{guides.map(renderGuide)}
		</div>
	);
}
