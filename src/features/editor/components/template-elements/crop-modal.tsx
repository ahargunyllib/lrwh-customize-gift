import type { CropArea, ImageElement } from "@/shared/types";
import { createPortal } from "react-dom";

export const CropModal = ({
	isOpen,
	onClose,
	image,
	originalDimensions,
	cropArea,
	setCropArea,
	applyCrop,
	onCropMouseDown,
	onCropResizeMouseDown,
}: {
	isOpen: boolean;
	onClose: () => void;
	image: ImageElement;
	originalDimensions: { width: number; height: number };
	cropArea: CropArea;
	setCropArea: (area: CropArea) => void;
	applyCrop: () => void;
	onCropMouseDown: (e: React.MouseEvent) => void;
	onCropResizeMouseDown: (e: React.MouseEvent, direction: string) => void;
}) => {
	if (!isOpen) return null;

	// Calculate optimal modal size - now we can use full viewport
	const maxModalWidth = Math.min(window.innerWidth * 0.95, 1200);
	const maxModalHeight = Math.min(window.innerHeight * 0.95, 800);

	// Calculate image display scale for larger display
	const headerHeight = 80;
	const footerHeight = 60;
	const padding = 0;
	const availableWidth = maxModalWidth - padding;
	const availableHeight =
		maxModalHeight - headerHeight - footerHeight - padding;

	const scaleX = availableWidth / originalDimensions.width;
	const scaleY = availableHeight / originalDimensions.height;
	const imageDisplayScale = Math.min(scaleX, scaleY, 1); // Allow up to 1.5x scaling

	const displayWidth = originalDimensions.width * imageDisplayScale;
	const displayHeight = originalDimensions.height * imageDisplayScale;

	const modalWidth = Math.min(displayWidth + padding, maxModalWidth);
	const modalHeight = Math.min(
		displayHeight + headerHeight + footerHeight + padding,
		maxModalHeight,
	);

	return createPortal(
		<>
			{/* Backdrop */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
			<div
				className="fixed inset-0 bg-black bg-opacity-20 z-[9998] backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Crop Modal */}
			<div
				className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
				style={{
					left: "50%",
					top: "50%",
					transform: "translate(-50%, -50%)",
					width: modalWidth,
					height: modalHeight,
					maxWidth: "95vw",
					maxHeight: "95vh",
				}}
			>
				{/* Header */}
				<div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
					<div>
						<h3 className="text-gray-900 font-semibold text-lg">
							Adjust Image Crop
						</h3>
						<p className="text-sm text-gray-600 mt-1">
							Drag to move • Resize corners to adjust • Target: {image.width} ×{" "}
							{image.height}px
						</p>
					</div>
					<div className="flex gap-3">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={applyCrop}
							className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
						>
							Apply Crop
						</button>
					</div>
				</div>

				{/* Image container with crop overlay */}
				<div className="flex-1 flex items-center justify-center  bg-gray-100">
					<div
						className="relative bg-white rounded-lg shadow-inner overflow-hidden"
						style={{
							width: displayWidth,
							height: displayHeight,
							maxWidth: availableWidth,
							maxHeight: availableHeight,
						}}
					>
						<img
							src={
								image.src ||
								"https://images.unsplash.com/photo-1501594907352-04cda38ebc29"
							}
							alt="Crop preview"
							className="w-full h-full object-contain select-none"
							draggable={false}
							style={{
								width: displayWidth,
								height: displayHeight,
							}}
						/>

						{/* Crop overlay with dark areas */}
						<div className="absolute inset-0">
							{/* Dark overlays */}
							<div
								className="absolute bg-black/40"
								style={{
									left: 0,
									top: 0,
									right: 0,
									height: cropArea.y * imageDisplayScale,
								}}
							/>
							<div
								className="absolute bg-black/40"
								style={{
									left: 0,
									top: (cropArea.y + cropArea.height) * imageDisplayScale,
									right: 0,
									bottom: 0,
								}}
							/>
							<div
								className="absolute bg-black/40"
								style={{
									left: 0,
									top: cropArea.y * imageDisplayScale,
									width: cropArea.x * imageDisplayScale,
									height: cropArea.height * imageDisplayScale,
								}}
							/>
							<div
								className="absolute bg-black/40"
								style={{
									left: (cropArea.x + cropArea.width) * imageDisplayScale,
									top: cropArea.y * imageDisplayScale,
									right: 0,
									height: cropArea.height * imageDisplayScale,
								}}
							/>

							{/* Crop selection area */}
							<div
								className="absolute border-2 border-blue-500 cursor-move shadow-lg"
								style={{
									left: cropArea.x * imageDisplayScale,
									top: cropArea.y * imageDisplayScale,
									width: cropArea.width * imageDisplayScale,
									height: cropArea.height * imageDisplayScale,
									backgroundColor: "transparent",
									boxShadow:
										"0 0 0 1px rgba(255,255,255,0.5), 0 4px 12px rgba(0,0,0,0.15)",
								}}
								onMouseDown={onCropMouseDown}
							>
								{/* Corner resize handles */}
								<div
									className="absolute -top-2 -left-2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-md cursor-nw-resize hover:bg-blue-50 transition-colors"
									onMouseDown={(e) => onCropResizeMouseDown(e, "nw")}
								/>
								<div
									className="absolute -top-2 -right-2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-md cursor-ne-resize hover:bg-blue-50 transition-colors"
									onMouseDown={(e) => onCropResizeMouseDown(e, "ne")}
								/>
								<div
									className="absolute -bottom-2 -left-2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-md cursor-sw-resize hover:bg-blue-50 transition-colors"
									onMouseDown={(e) => onCropResizeMouseDown(e, "sw")}
								/>
								<div
									className="absolute -bottom-2 -right-2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-md cursor-se-resize hover:bg-blue-50 transition-colors"
									onMouseDown={(e) => onCropResizeMouseDown(e, "se")}
								/>

								{/* Grid lines for rule of thirds */}
								<div className="absolute inset-0 pointer-events-none">
									<div className="absolute left-1/3 top-0 bottom-0 w-px bg-white opacity-60" />
									<div className="absolute left-2/3 top-0 bottom-0 w-px bg-white opacity-60" />
									<div className="absolute top-1/3 left-0 right-0 h-px bg-white opacity-60" />
									<div className="absolute top-2/3 left-0 right-0 h-px bg-white opacity-60" />
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Footer with crop info */}
				<div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
					<div className="flex justify-between items-center text-sm text-gray-600">
						<div>
							Crop area: {Math.round(cropArea.width)} ×{" "}
							{Math.round(cropArea.height)}px
						</div>
						<div>
							Position: {Math.round(cropArea.x)}, {Math.round(cropArea.y)}
						</div>
					</div>
				</div>
			</div>
		</>,
		document.body,
	);
};
