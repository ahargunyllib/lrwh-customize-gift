"use client";

interface RulerBarProps {
	orientation: "horizontal" | "vertical";
	length: number;
	scale: number;
	onDragStart: (e: React.MouseEvent) => void;
}

export default function RulerBar({
	orientation,
	length,
	scale,
	onDragStart,
}: RulerBarProps) {
	const rulerSize = 30; // Height for horizontal, width for vertical
	const pixelsPerCm = 40;
	const scaledLength = length * scale;

	// Generate tick marks every 1cm (40px) and labels every 5cm
	const ticks = [];
	const totalCm = Math.ceil(length / pixelsPerCm);

	for (let i = 0; i <= totalCm; i++) {
		const position = i * pixelsPerCm * scale;
		const isMajor = i % 5 === 0;

		if (orientation === "horizontal") {
			ticks.push(
				<div
					key={i}
					className="absolute"
					style={{
						left: position,
						bottom: 0,
						width: "1px",
						height: isMajor ? "12px" : "6px",
						backgroundColor: isMajor ? "#666" : "#999",
					}}
				/>,
			);

			if (isMajor && i > 0) {
				ticks.push(
					<div
						key={`label-${i}`}
						className="absolute text-[9px] text-gray-600 select-none"
						style={{
							left: position + 2,
							bottom: 2,
						}}
					>
						{i}
					</div>,
				);
			}
		} else {
			ticks.push(
				<div
					key={i}
					className="absolute"
					style={{
						top: position,
						right: 0,
						height: "1px",
						width: isMajor ? "12px" : "6px",
						backgroundColor: isMajor ? "#666" : "#999",
					}}
				/>,
			);

			if (isMajor && i > 0) {
				ticks.push(
					<div
						key={`label-${i}`}
						className="absolute text-[9px] text-gray-600 select-none"
						style={{
							top: position + 2,
							right: 2,
							transform: "rotate(-90deg)",
							transformOrigin: "right top",
						}}
					>
						{i}
					</div>,
				);
			}
		}
	}

	if (orientation === "horizontal") {
		return (
			<div
				className="absolute top-0 left-0 bg-gray-200 border-b border-gray-300 cursor-ns-resize select-none"
				style={{
					width: scaledLength,
					height: rulerSize,
				}}
				onMouseDown={onDragStart}
			>
				{ticks}
			</div>
		);
	}

	return (
		<div
			className="absolute top-0 left-0 bg-gray-200 border-r border-gray-300 cursor-ew-resize select-none"
			style={{
				width: rulerSize,
				height: scaledLength,
			}}
			onMouseDown={onDragStart}
		>
			{ticks}
		</div>
	);
}
