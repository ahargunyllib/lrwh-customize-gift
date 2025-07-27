"use client";

import type { LineElement } from "@/shared/types/element/line";
import { toast } from "sonner";
import { useElementTransform } from "../../hooks/use-element-transform";
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

function renderLineTip(
	tip: string,
	isStart: boolean,
	x: number,
	y: number,
	angle: number,
	stroke: string,
	strokeWidth: number,
) {
	if (tip === "none") return null;

	if (tip === "arrow") {
		const size = Math.max(strokeWidth * 2, 8);
		return (
			<polygon
				points={`-${size},-${size / 2} 0,0 -${size},${size / 2}`}
				transform={`translate(${x}, ${y}) rotate(${angle})`}
				fill={stroke}
			/>
		);
	}

	if (tip === "circle") {
		const radius = Math.max(strokeWidth, 4);
		return (
			<circle
				cx={x}
				cy={y}
				r={radius}
				fill="none"
				stroke={stroke}
				strokeWidth={strokeWidth}
			/>
		);
	}

	return (
		<polygon
			points="-5,-5 5,0 -5,5"
			transform={`translate(${x}, ${y}) rotate(${angle})`}
			fill={stroke}
		/>
	);
}

export default function TemplateLine(props: Props) {
	const { startLineDrag, startEndpointDrag } = useLineTransform({
		start: props.element.startPoint,
		end: props.element.endPoint,
		scale: props.scale,
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
	const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

	const strokeColor = element.strokeColor || "#000000";
	const strokeWidth = element.strokeWidth || 2;
	const startTip = element.startTip || "none";
	const endTip = element.endTip || "none";

	const lineStyle = element.type || "line-medium";
	const styleInfo = LINE_STYLES[lineStyle] || LINE_STYLES["line-medium"];

	// Scale
	const scale = props.scale ?? 1;

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
			}}
		>
			<svg
				width="100%"
				height="100%"
				style={{ overflow: "visible", pointerEvents: "auto" }}
			>
				<title>{"Line Element"}</title>
				<g>
					{/* Base line */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
					<line
						x1={0}
						y1={0}
						x2={dx * scale}
						y2={dy * scale}
						stroke="transparent"
						strokeWidth={Math.max(strokeWidth * 3 * scale, 10)}
						style={{ cursor: "pointer" }}
						onClick={(e) => {
							e.stopPropagation();
							props.toggleActive(e);
						}}
						onMouseDown={(e) => {
							e.stopPropagation();
							toast.success("Line element clicked");
							startLineDrag(e);
						}}
					/>
					<line
						x1={0}
						y1={0}
						x2={dx * scale}
						y2={dy * scale}
						stroke={strokeColor}
						strokeWidth={strokeWidth * scale}
						strokeDasharray={styleInfo.dashArray}
						style={{ cursor: "pointer", pointerEvents: "stroke" }}
					/>

					{/* Tips */}
					{renderLineTip(startTip, true, 0, 0, angle, strokeColor, strokeWidth)}
					{renderLineTip(
						endTip,
						false,
						dx,
						dy,
						angle,
						strokeColor,
						strokeWidth,
					)}

					{/* Active Selection */}
					{props.isElementActive && (
						<>
							<line
								x1={0}
								y1={0}
								x2={dx * scale}
								y2={dy * scale}
								stroke="#1E88E5"
								strokeWidth={1}
								strokeDasharray="4 4"
								pointerEvents="none"
							/>
							<circle
								cx={0}
								cy={0}
								r={4}
								fill="#1E88E5"
								stroke="#ffffff"
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
								fill="#1E88E5"
								stroke="#ffffff"
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
