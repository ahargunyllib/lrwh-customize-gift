import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

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
			<button
				type="button"
				onClick={zoomIn}
				className="p-2 hover:bg-gray-100 rounded transition-colors"
				title="Zoom In"
				aria-label="Zoom In"
			>
				<ZoomIn size={20} />
			</button>
			<button
				type="button"
				onClick={zoomOut}
				className="p-2 hover:bg-gray-100 rounded transition-colors"
				title="Zoom Out"
				aria-label="Zoom Out"
			>
				<ZoomOut size={20} />
			</button>
			<button
				type="button"
				onClick={resetZoom}
				className="p-2 hover:bg-gray-100 rounded transition-colors"
				title="Reset Zoom"
				aria-label="Reset Zoom"
			>
				<RotateCcw size={20} />
			</button>
		</div>
	);
}
