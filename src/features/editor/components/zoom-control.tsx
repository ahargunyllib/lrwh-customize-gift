import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "../../../shared/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "../../../shared/components/ui/tooltip";

interface ZoomControlProps {
	zoomIn: () => void;
	zoomOut: () => void;
	resetZoom: () => void;
}

export default function ZoomControl({
	zoomIn,
	zoomOut,
	resetZoom,
}: ZoomControlProps) {
	return (
		<div className="fixed bottom-4 right-4 z-10 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2">
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						onClick={zoomIn}
						variant="ghost"
						className="size-10"
						size="icon"
						aria-label="Zoom In"
					>
						<ZoomIn className="size-6" />
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<span>Zoom In</span>
				</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						onClick={zoomOut}
						variant="ghost"
						className="size-10"
						size="icon"
						aria-label="Zoom Out"
					>
						<ZoomOut className="size-6" />
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<span>Zoom Out</span>
				</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						className="size-10"
						size="icon"
						aria-label="Reset Zoom"
						onClick={resetZoom}
					>
						<RotateCcw className="size-6" />
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<span>Reset Zoom</span>
				</TooltipContent>
			</Tooltip>
		</div>
	);
}
