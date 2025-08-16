"use client";

import type { LineElement } from "@/shared/types/element/line";
import { useLineTransform } from "../../hooks/use-line-transform";
import type { TemplateElementBaseProps } from "./template-shape";

interface Props extends TemplateElementBaseProps {
	element: LineElement;
	onUpdate: (update: Partial<LineElement>) => void;
}

const LINE_STYLES: Record<string, { dashArray?: string }> = {
	"line-medium": { dashArray: "" },
	"line-thin": { dashArray: "" },
	"line-thick": { dashArray: "" },
	"line-dashed": { dashArray: "5,5" },
	"line-dotted": { dashArray: "1,4" },
	"line-arrow": { dashArray: "" },
};

function renderLineTip({
	tip,
	isStart,
	xPosition,
	yPosition,
	angle,
	strokeColor,
	strokeWidth,
	scale,
}: {
	tip: string;
	isStart: boolean;
	xPosition: number;
	yPosition: number;
	angle: number;
	strokeColor: string;
	strokeWidth: number;
	scale: number;
}) {
	if (tip === "none") return null;

	if (tip === "arrow") {
		const size = Math.max(strokeWidth * 2, 8);
		return (
			<polygon
				points={`-${size},-${size / 2} 0,0 -${size},${size / 2}`}
				transform={`translate(${xPosition}, ${yPosition}) rotate(${isStart ? angle + 180 : angle})`}
				fill={strokeColor}
			/>
		);
	}

	if (tip === "circle") {
		const radius = Math.max(strokeWidth, 4);
		return (
			<circle
				cx={xPosition}
				cy={yPosition}
				r={radius}
				fill="none"
				stroke={strokeColor}
				strokeWidth={strokeWidth}
			/>
		);
	}

	if (tip === "rounded") {
		const radius = Math.max(strokeWidth / 4, 1) * scale;
		return (
			<circle cx={xPosition} cy={yPosition} r={radius} fill={strokeColor} />
		);
	}

	return (
		<polygon
			points="-5,-5 5,0 -5,5"
			transform={`translate(${xPosition}, ${yPosition}) rotate(${angle})`}
			fill={strokeColor}
		/>
	);
}

// Helper function to calculate tip size for trimming (unscaled)
function getTipSize(tip: string, strokeWidth: number): number {
	if (tip === "none") return 0;

	if (tip === "arrow") {
		return Math.max(strokeWidth * 2, 8);
	}

	if (tip === "circle") {
		return Math.max(strokeWidth, 4);
	}

	if (tip === "rounded") {
		return Math.max(strokeWidth / 8, 0.5);
	}

	// Default tip size
	return 5;
}

export default function TemplateLine(props: Props) {
	const { startLineDrag, startEndpointDrag } = useLineTransform({
		start: props.element.startPoint,
		end: props.element.endPoint,
		scale: props.scale, // Pass scale to the hook
		onChange: (points) => {
			props.onUpdate({
				startPoint: points.start,
				endPoint: points.end,
			});
		},
	});

	const element = props.element;

	// Start and end points
	const startX = element.startPoint?.x ?? 0;
	const startY = element.startPoint?.y ?? 0;
	const endX = element.endPoint?.x ?? 0;
	const endY = element.endPoint?.y ?? 0;

	const dx = endX - startX;
	const dy = endY - startY;
	const length = Math.sqrt(dx * dx + dy * dy);
	const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

	const strokeColor = element.strokeColor || "#000000";
	const strokeWidth = element.strokeWidth || 2;
	const startTip = element.startTip || "none";
	const endTip = element.endTip || "none";

	const lineStyle = element.type || "line-medium";
	const styleInfo = LINE_STYLES[lineStyle] || LINE_STYLES["line-medium"];

	// Scale
	const scale = props.scale ?? 1;

	// Calculate trimming distances using scaled strokeWidth to match rendered tips
	const startTipSize = getTipSize(startTip, strokeWidth * scale);
	const endTipSize = getTipSize(endTip, strokeWidth * scale);

	// Calculate unit vector for the line direction
	const unitX = length > 0 ? dx / length : 0;
	const unitY = length > 0 ? dy / length : 0;

	// Calculate trimmed line coordinates (in scaled space)
	const trimmedStartX = startTipSize * unitX;
	const trimmedStartY = startTipSize * unitY;
	const trimmedEndX = dx * scale - endTipSize * unitX;
	const trimmedEndY = dy * scale - endTipSize * unitY;

	return (
		// Container for the line element
		<div
			className={`line-element ${props.isElementActive ? "active" : ""}`}
			style={{
				position: "absolute",
				transform: `translate(${startX * scale}px, ${startY * scale}px)`,
				width: `${Math.abs(dx) * scale}px`,
				height: `${strokeWidth * scale}px`,
				pointerEvents: "none",
				zIndex: props.element.zIndex || 1,
			}}
		>
			<svg
				width="100%"
				height="100%"
				style={{ overflow: "visible", pointerEvents: "auto" }}
			>
				<title>{"Line Element"}</title>
				<g>
					{/* Base line (invisible, for clicking) */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
					<line
						x1={0}
						y1={0}
						x2={dx * scale}
						y2={dy * scale}
						stroke="transparent"
						strokeWidth={Math.max(strokeWidth * 3 * scale, 10)}
						style={{
							cursor: props.isPreview ? "auto" : "pointer",
						}}
						onClick={(e) => {
							e.stopPropagation();
							props.toggleActive(e);
						}}
						onMouseDown={(e) => {
							e.stopPropagation();
							startLineDrag(e);
						}}
					/>

					<g>
						{/* Visible line (trimmed if tips are present) */}
						<line
							x1={trimmedStartX}
							y1={trimmedStartY}
							x2={trimmedEndX}
							y2={trimmedEndY}
							stroke={strokeColor}
							strokeWidth={strokeWidth * scale}
							strokeDasharray={styleInfo.dashArray}
							style={{ pointerEvents: "none" }}
						/>

						{/* Line Tip */}
						{renderLineTip({
							tip: startTip,
							isStart: true,
							xPosition: 0,
							yPosition: 0,
							angle,
							strokeColor,
							strokeWidth: strokeWidth * scale,
							scale,
						})}
						{renderLineTip({
							tip: endTip,
							isStart: false,
							xPosition: dx * scale,
							yPosition: dy * scale,
							angle,
							strokeColor,
							strokeWidth: strokeWidth * scale,
							scale,
						})}
					</g>

					{/* Active Selection - Keep handles outside clipping */}
					{props.isElementActive && (
						<>
							<circle
								cx={0}
								cy={0}
								r={4}
								stroke="#1E88E5"
								fill="#ffffff"
								strokeWidth={1}
								style={{ cursor: "nw-resize" }}
								onMouseDown={(e) => {
									e.stopPropagation();
									startEndpointDrag("start")(e);
								}}
							/>
							<circle
								cx={dx * scale}
								cy={dy * scale}
								r={4}
								fill="#ffffff"
								stroke="#1E88E5"
								strokeWidth={1}
								style={{ cursor: "se-resize" }}
								onMouseDown={(e) => {
									e.stopPropagation();
									startEndpointDrag("end")(e);
								}}
							/>
						</>
					)}
				</g>
			</svg>
		</div>
	);
}
