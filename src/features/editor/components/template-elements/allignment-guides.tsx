"use client";

import type { Guide } from "../../hooks/use-allignment-guides";

interface AlignmentGuidesProps {
	scale: number;
	guides: Guide[];
	canvasWidth: number;
	canvasHeight: number;
}

export default function AlignmentGuides({
	scale,
	guides,
	canvasWidth,
	canvasHeight,
}: AlignmentGuidesProps) {
	return (
		<div className="absolute inset-0 pointer-events-none">
			{guides.map((guide, index) => {
				if (guide.type === "centerX") {
					return (
						<div
							key={`${guide.type}-${index}`}
							className="absolute top-0 bottom-0 w-px bg-blue-500"
							style={{
								left: guide.position * scale,
								boxShadow: "0 0 2px rgba(59, 130, 246, 0.8)",
							}}
						/>
					);
				}

				if (guide.type === "centerY") {
					return (
						<div
							key={`${guide.type}-${index}`}
							className="absolute left-0 right-0 h-px bg-blue-500"
							style={{
								top: guide.position * scale,
								boxShadow: "0 0 2px rgba(59, 130, 246, 0.8)",
							}}
						/>
					);
				}

				if (guide.type === "centerToCenterX") {
					return (
						<div
							key={`${guide.type}-${index}`}
							className="absolute w-px bg-purple-500"
							style={{
								left: guide.position * scale,
								top: (guide.startPosition ?? 0) * scale,
								height:
									guide.endPosition && guide.startPosition
										? guide.endPosition - guide.startPosition
										: "100%",
								boxShadow: "0 0 2px rgba(168, 85, 247, 0.8)",
							}}
						/>
					);
				}

				if (guide.type === "centerToCenterY") {
					return (
						<div
							key={`${guide.type}-${index}`}
							className="absolute h-px bg-purple-500"
							style={{
								top: guide.position * scale,
								left: (guide.startPosition ?? 0) * scale,
								width:
									guide.endPosition && guide.startPosition
										? guide.endPosition - guide.startPosition
										: "100%",
								boxShadow: "0 0 2px rgba(168, 85, 247, 0.8)",
							}}
						/>
					);
				}

				if (guide.type === "alignLeft" || guide.type === "alignRight") {
					return (
						<div
							key={`${guide.type}-${index}`}
							className="absolute top-0 bottom-0 w-px bg-green-500"
							style={{
								left: guide.position * scale,
								boxShadow: "0 0 2px rgba(34, 197, 94, 0.8)",
							}}
						/>
					);
				}

				if (guide.type === "alignTop" || guide.type === "alignBottom") {
					return (
						<div
							key={`${guide.type}-${index}`}
							className="absolute left-0 right-0 h-px bg-green-500"
							style={{
								top: guide.position * scale,
								boxShadow: "0 0 2px rgba(34, 197, 94, 0.8)",
							}}
						/>
					);
				}

				return null;
			})}
		</div>
	);
}
