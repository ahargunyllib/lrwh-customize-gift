import type { CropArea, ImageElement } from "@/shared/types";
import { Check, X } from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "../../../../shared/components/ui/button";

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
	onCropTouchStart,
	onCropResizeTouchStart,
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
	onCropTouchStart: (e: React.TouchEvent) => void;
	onCropResizeTouchStart: (e: React.TouchEvent, direction: string) => void;
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
	const imageDisplayScale = Math.min(scaleX, scaleY, 1);

	const displayWidth = originalDimensions.width * imageDisplayScale;
	const displayHeight = originalDimensions.height * imageDisplayScale;

	// Calculate modal dimensions with proper minimum sizes
	const minModalWidth = 400; // Minimum width for small images
	const minModalHeight = 300 + headerHeight + footerHeight; // Minimum height for small images

	const modalWidth = Math.min(
		Math.max(displayWidth + padding * 2, minModalWidth),
		maxModalWidth,
	);
	const modalHeight = Math.min(
		Math.max(
			displayHeight + headerHeight + footerHeight + padding * 2,
			minModalHeight,
		),
		maxModalHeight,
	);

	return createPortal(
		<>
			{/* Backdrop */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
			<div
				className="fixed inset-0 z-[9998] backdrop-blur-xs bg-black/30"
				onClick={onClose}
			/>

			{/* Crop Modal */}
			<div
				className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-auto"
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
				<div className="flex flex-col gap-1 px-6 py-4 border-b border-gray-200 bg-gray-50">
					<div className="flex justify-between gap-2 items-start">
						<h3 className="text-gray-900 font-semibold text-sm md:text-lg">
							Sesuaikan Pemotongan Gambar
						</h3>
						<div className="flex flex-row gap-3">
							<Button
								onClick={onClose}
								size="icon"
								variant="secondary"
								className="px-4 py-2 h-fit bg-[#F2F4F7] hover:bg-[#dcdcdf] rounded-md shadow-none text-sm text-[#344054]"
							>
								<X />
							</Button>
							<Button
								onClick={applyCrop}
								size="icon"
								className="px-4 py-2 h-fit bg-[#2854AD] hover:bg-[#2854AD]/80 rounded-md shadow-none text-sm text-[#ffffff]"
							>
								<Check />
							</Button>
						</div>
					</div>
					<p className="text-gray-600 text-xs md:text-sm">
						Gunakan alat di bawah ini untuk menyesuaikan area pemotongan gambar.
						Tarik dan ubah ukuran kotak pemotongan sesuai keinginan Anda.
					</p>
				</div>

				{/* Image container with crop overlay */}
				<div className="flex-1 flex items-center justify-center bg-gray-100">
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
							src={image.src}
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
								className="absolute border-2 border-blue-500 cursor-move shadow-lg touch-none"
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
								onTouchStart={onCropTouchStart}
							>
								{/* Corner resize handles */}
								<div
									className="absolute -top-2 -left-2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-md cursor-nw-resize hover:bg-blue-50 transition-colors touch-none"
									onMouseDown={(e) => onCropResizeMouseDown(e, "nw")}
									onTouchStart={(e) => onCropResizeTouchStart(e, "nw")}
								/>
								<div
									className="absolute -top-2 -right-2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-md cursor-ne-resize hover:bg-blue-50 transition-colors touch-none"
									onMouseDown={(e) => onCropResizeMouseDown(e, "ne")}
									onTouchStart={(e) => onCropResizeTouchStart(e, "ne")}
								/>
								<div
									className="absolute -bottom-2 -left-2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-md cursor-sw-resize hover:bg-blue-50 transition-colors touch-none"
									onMouseDown={(e) => onCropResizeMouseDown(e, "sw")}
									onTouchStart={(e) => onCropResizeTouchStart(e, "sw")}
								/>
								<div
									className="absolute -bottom-2 -right-2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-md cursor-se-resize hover:bg-blue-50 transition-colors touch-none"
									onMouseDown={(e) => onCropResizeMouseDown(e, "se")}
									onTouchStart={(e) => onCropResizeTouchStart(e, "se")}
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
							Area potong: {Math.round(cropArea.width)} ×{" "}
							{Math.round(cropArea.height)}px
						</div>
						<div>
							Posisi: {Math.round(cropArea.x)}, {Math.round(cropArea.y)}
						</div>
					</div>
				</div>
			</div>
		</>,
		document.body,
	);
};
