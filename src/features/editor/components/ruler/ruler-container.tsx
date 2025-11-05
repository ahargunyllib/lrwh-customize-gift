"use client";

import { Ruler } from "lucide-react";
import { useRef, useState } from "react";
import HorizontalRuler from "./horizontal-ruler";
import VerticalRuler from "./vertical-ruler";

interface RulerContainerProps {
	scale: number;
	canvasWidth: number;
	canvasHeight: number;
	children: React.ReactNode;
}

export default function RulerContainer({
	scale,
	canvasWidth,
	canvasHeight,
	children,
}: RulerContainerProps) {
	const [showRulers, setShowRulers] = useState(true);
	const [showHorizontalRuler, setShowHorizontalRuler] = useState(false);
	const [showVerticalRuler, setShowVerticalRuler] = useState(false);
	const horizontalRulerRef = useRef<{
		setPosition: (pos: number) => void;
	}>(null);
	const verticalRulerRef = useRef<{
		setPosition: (pos: number) => void;
	}>(null);

	const handleAddHorizontalRuler = () => {
		setShowHorizontalRuler(true);
		// Set initial position to center
		setTimeout(() => {
			horizontalRulerRef.current?.setPosition(canvasHeight / 2);
		}, 0);
	};

	const handleAddVerticalRuler = () => {
		setShowVerticalRuler(true);
		// Set initial position to center
		setTimeout(() => {
			verticalRulerRef.current?.setPosition(canvasWidth / 2);
		}, 0);
	};

	const handleRemoveHorizontalRuler = () => {
		setShowHorizontalRuler(false);
	};

	const handleRemoveVerticalRuler = () => {
		setShowVerticalRuler(false);
	};

	return (
		<div className="relative">
			{/* Control buttons */}
			<div className="absolute -top-10 right-0 z-50 flex items-center gap-2">
				{showRulers && (
					<>
						<button
							type="button"
							onClick={handleAddHorizontalRuler}
							disabled={showHorizontalRuler}
							className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
								showHorizontalRuler
									? "bg-gray-200 text-gray-400 cursor-not-allowed"
									: "bg-pink-500 text-white hover:bg-pink-600"
							}`}
							title="Add Horizontal Ruler"
						>
							<Ruler className="h-3.5 w-3.5" />
							Horizontal
						</button>
						<button
							type="button"
							onClick={handleAddVerticalRuler}
							disabled={showVerticalRuler}
							className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
								showVerticalRuler
									? "bg-gray-200 text-gray-400 cursor-not-allowed"
									: "bg-cyan-500 text-white hover:bg-cyan-600"
							}`}
							title="Add Vertical Ruler"
						>
							<Ruler className="h-3.5 w-3.5 rotate-90" />
							Vertical
						</button>
					</>
				)}
				<button
					type="button"
					onClick={() => setShowRulers(!showRulers)}
					className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
						showRulers
							? "bg-gray-200 text-gray-700 hover:bg-gray-300"
							: "bg-blue-500 text-white hover:bg-blue-600"
					}`}
					title={showRulers ? "Hide Ruler Controls" : "Show Ruler Controls"}
				>
					<Ruler className="h-3.5 w-3.5" />
					{showRulers ? "Hide" : "Show"}
				</button>
			</div>

			{/* Canvas with rulers */}
			<div className="relative">
				{children}

				{showRulers && showHorizontalRuler && (
					<HorizontalRuler
						ref={horizontalRulerRef}
						scale={scale}
						canvasWidth={canvasWidth}
						canvasHeight={canvasHeight}
						onRemove={handleRemoveHorizontalRuler}
					/>
				)}
				{showRulers && showVerticalRuler && (
					<VerticalRuler
						ref={verticalRulerRef}
						scale={scale}
						canvasWidth={canvasWidth}
						canvasHeight={canvasHeight}
						onRemove={handleRemoveVerticalRuler}
					/>
				)}
			</div>
		</div>
	);
}
