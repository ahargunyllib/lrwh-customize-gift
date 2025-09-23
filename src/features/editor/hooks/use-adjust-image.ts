import type { TemplateData } from "@/shared/types/template";
import { useCallback } from "react";

interface UseImageAdjustProps {
	template: TemplateData;
	setTemplate: React.Dispatch<React.SetStateAction<TemplateData>>;
}

export function useImageAdjust({ template, setTemplate }: UseImageAdjustProps) {
	const handleImageAdjust = useCallback(
		(event: CustomEvent) => {
			const { id, imageOffset, scaleX, scaleY, fit } = event.detail;

			setTemplate((prevTemplate) => {
				const imageIndex = prevTemplate.images.findIndex(
					(img) => img.id === id,
				);
				if (imageIndex === -1) return prevTemplate;

				const updatedImages = [...prevTemplate.images];
				const currentImage = updatedImages[imageIndex];

				// Update the image with new offset and scale
				updatedImages[imageIndex] = {
					...currentImage,
					imageOffset: imageOffset ?? currentImage.imageOffset,
					scaleX: scaleX ?? currentImage.scaleX ?? 1,
					scaleY: scaleY ?? currentImage.scaleY ?? 1,
				};

				return {
					...prevTemplate,
					images: updatedImages,
				};
			});
		},
		[setTemplate],
	);

	// Helper function to calculate optimal fit
	const calculateImageFit = useCallback(
		(
			imageId: string,
			fitType: "cover" | "contain" | "fill" | "fit-width" | "fit-height",
		) => {
			const image = template.images.find((img) => img.id === imageId);
			if (!image) return;

			// You would need to get the natural dimensions of the image
			// This could be stored when the image loads or passed as parameter
			const naturalWidth = 800; // Replace with actual natural width
			const naturalHeight = 600; // Replace with actual natural height

			let newScaleX: number;
			let newScaleY: number;
			let newOffset: { x: number; y: number };

			const containerAspectRatio = image.width / image.height;
			const imageAspectRatio = naturalWidth / naturalHeight;

			switch (fitType) {
				case "cover": {
					// Scale image to cover entire container
					const coverScaleX = image.width / naturalWidth;
					const coverScaleY = image.height / naturalHeight;
					const coverScale = Math.max(coverScaleX, coverScaleY);
					newScaleX = coverScale;
					newScaleY = coverScale;

					const coverScaledWidth = naturalWidth * coverScale;
					const coverScaledHeight = naturalHeight * coverScale;

					newOffset = {
						x: (image.width - coverScaledWidth) / 2,
						y: (image.height - coverScaledHeight) / 2,
					};
					break;
				}

				case "contain": {
					// Scale image to fit entirely within container
					const containScaleX = image.width / naturalWidth;
					const containScaleY = image.height / naturalHeight;
					const containScale = Math.min(containScaleX, containScaleY);
					newScaleX = containScale;
					newScaleY = containScale;

					const containScaledWidth = naturalWidth * containScale;
					const containScaledHeight = naturalHeight * containScale;

					newOffset = {
						x: (image.width - containScaledWidth) / 2,
						y: (image.height - containScaledHeight) / 2,
					};
					break;
				}

				case "fill":
					// Stretch image to fill container exactly (may distort)
					newScaleX = image.width / naturalWidth;
					newScaleY = image.height / naturalHeight;
					newOffset = { x: 0, y: 0 };
					break;

				case "fit-width": {
					// Scale to fit width, height may overflow/underflow
					newScaleX = image.width / naturalWidth;
					newScaleY = newScaleX; // Maintain aspect ratio
					const fitWidthScaledHeight = naturalHeight * newScaleY;
					newOffset = {
						x: 0,
						y: (image.height - fitWidthScaledHeight) / 2,
					};
					break;
				}

				case "fit-height": {
					// Scale to fit height, width may overflow/underflow
					newScaleY = image.height / naturalHeight;
					newScaleX = newScaleY; // Maintain aspect ratio
					const fitHeightScaledWidth = naturalWidth * newScaleX;
					newOffset = {
						x: (image.width - fitHeightScaledWidth) / 2,
						y: 0,
					};
					break;
				}

				default:
					return;
			}

			// Dispatch the adjustment
			document.dispatchEvent(
				new CustomEvent("imageAdjust", {
					detail: {
						id: imageId,
						imageOffset: newOffset,
						scaleX: newScaleX,
						scaleY: newScaleY,
					},
				}),
			);
		},
		[template.images],
	);

	// Helper to reset image to original state
	const resetImage = useCallback(
		(imageId: string) => {
			calculateImageFit(imageId, "cover");
		},
		[calculateImageFit],
	);

	// Helper to zoom image
	const zoomImage = useCallback(
		(
			imageId: string,
			zoomFactorX: number,
			zoomFactorY: number = zoomFactorX,
			centerPoint?: { x: number; y: number },
		) => {
			const image = template.images.find((img) => img.id === imageId);
			if (!image) return;

			const currentScaleX = image.scaleX || 1;
			const currentScaleY = image.scaleY || 1;
			const currentOffset = image.imageOffset || { x: 0, y: 0 };
			const newScaleX = Math.max(0.1, currentScaleX * zoomFactorX);
			const newScaleY = Math.max(0.1, currentScaleY * zoomFactorY);

			let newOffset = currentOffset;

			// If center point is provided, zoom towards that point
			if (centerPoint) {
				const scaleChangeX = newScaleX / currentScaleX;
				const scaleChangeY = newScaleY / currentScaleY;

				newOffset = {
					x: centerPoint.x - (centerPoint.x - currentOffset.x) * scaleChangeX,
					y: centerPoint.y - (centerPoint.y - currentOffset.y) * scaleChangeY,
				};
			}

			document.dispatchEvent(
				new CustomEvent("imageAdjust", {
					detail: {
						id: imageId,
						imageOffset: newOffset,
						scaleX: newScaleX,
						scaleY: newScaleY,
					},
				}),
			);
		},
		[template.images],
	);

	// Helper to pan image
	const panImage = useCallback(
		(imageId: string, deltaX: number, deltaY: number) => {
			const image = template.images.find((img) => img.id === imageId);
			if (!image) return;

			const currentOffset = image.imageOffset || { x: 0, y: 0 };
			const newOffset = {
				x: currentOffset.x + deltaX,
				y: currentOffset.y + deltaY,
			};

			document.dispatchEvent(
				new CustomEvent("imageAdjust", {
					detail: {
						id: imageId,
						imageOffset: newOffset,
					},
				}),
			);
		},
		[template.images],
	);

	return {
		handleImageAdjust,
		calculateImageFit,
		resetImage,
		zoomImage,
		panImage,
	};
}
