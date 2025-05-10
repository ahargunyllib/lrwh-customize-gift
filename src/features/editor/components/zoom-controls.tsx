"use client";
import { Button } from "@/shared/components/ui/button";
import { Slider } from "@/shared/components/ui/slider";
import { Maximize, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";

interface ZoomControlsProps {
	zoom: number;
	onZoomChange: (zoom: number) => void;
	onZoomIn: () => void;
	onZoomOut: () => void;
	onFitToScreen: () => void;
}

export default function ZoomControls({
	zoom,
	onZoomChange,
	onZoomIn,
	onZoomOut,
	onFitToScreen,
}: ZoomControlsProps) {
	const [sliderValue, setSliderValue] = useState(zoom);

	const handleSliderChange = (value: number[]) => {
		setSliderValue(value[0]);
	};

	const handleSliderCommit = () => {
		onZoomChange(sliderValue);
	};

	return (
		<div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-md px-3 py-1.5 shadow-sm">
			<Button
				variant="ghost"
				size="icon"
				className="h-8 w-8"
				onClick={onZoomOut}
			>
				<ZoomOut className="h-4 w-4" />
			</Button>

			<div className="flex items-center gap-2 w-40">
				<Slider
					value={[sliderValue]}
					min={10}
					max={200}
					step={1}
					onValueChange={handleSliderChange}
					onValueCommit={handleSliderCommit}
					className="flex-1"
				/>
				<span className="text-xs font-medium w-10 text-right">
					{sliderValue}%
				</span>
			</div>

			<Button
				variant="ghost"
				size="icon"
				className="h-8 w-8"
				onClick={onZoomIn}
			>
				<ZoomIn className="h-4 w-4" />
			</Button>

			<Button
				variant="ghost"
				size="icon"
				className="h-8 w-8"
				onClick={onFitToScreen}
				title="Fit to screen"
			>
				<Maximize className="h-4 w-4" />
			</Button>
		</div>
	);
}
