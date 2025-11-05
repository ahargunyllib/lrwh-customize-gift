"use client";

import GuideLine from "./guide-line";

interface Guide {
	id: string;
	orientation: "horizontal" | "vertical";
	position: number;
}

interface GuidesOverlayProps {
	guides: Guide[];
	scale: number;
	canvasWidth: number;
	canvasHeight: number;
	onPositionChange: (id: string, position: number) => void;
	onRemove: (id: string) => void;
}

export default function GuidesOverlay({
	guides,
	scale,
	canvasWidth,
	canvasHeight,
	onPositionChange,
	onRemove,
}: GuidesOverlayProps) {
	return (
		<div
			className="absolute pointer-events-none z-40"
			style={{
				width: canvasWidth * scale,
				height: canvasHeight * scale,
				transform: `scale(${scale})`,
				transformOrigin: "center center",
			}}
		>
			{guides.map((guide) => (
				<GuideLine
					key={guide.id}
					id={guide.id}
					orientation={guide.orientation}
					position={guide.position}
					scale={scale}
					renderScale={1}
					canvasSize={
						guide.orientation === "horizontal" ? canvasHeight : canvasWidth
					}
					onPositionChange={onPositionChange}
					onRemove={onRemove}
				/>
			))}
		</div>
	);
}
