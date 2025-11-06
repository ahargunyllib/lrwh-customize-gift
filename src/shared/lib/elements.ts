import type { TextElement } from "../types/template";
import type { TemplateData } from "../types/template";

export function validateTextElement(text: TextElement): TextElement {
	return {
		...text,
		width: text.width && !Number.isNaN(text.width) ? text.width : 200,
		height: text.height && !Number.isNaN(text.height) ? text.height : 100,
		position: {
			x:
				text.position.x && !Number.isNaN(text.position.x) ? text.position.x : 0,
			y:
				text.position.y && !Number.isNaN(text.position.y) ? text.position.y : 0,
		},
		style: {
			...text.style,
			fontSize: text.style.fontSize,
			padding:
				text.style.padding && !Number.isNaN(Number(text.style.padding))
					? text.style.padding
					: 8,
			textAlign: text.style.textAlign || "left",
			verticalAlign: text.style.verticalAlign || "top",
		},
	};
}

export interface TextHeightCalculation {
	lines: number;
	requiredHeight: number;
	lineHeight: number;
}

export function calculateTextHeight(
	content: string,
	fontSize: number,
	lineHeight: string | number,
	width: number,
	fontFamily = "Arial, sans-serif",
	padding = 8,
): TextHeightCalculation {
	// Parse line height
	let lineHeightPx: number;
	if (typeof lineHeight === "string") {
		if (lineHeight.includes("px")) {
			lineHeightPx = Number.parseFloat(lineHeight);
		} else {
			// Assume it's a multiplier (e.g., "1.4")
			lineHeightPx = fontSize * Number.parseFloat(lineHeight);
		}
	} else {
		lineHeightPx = fontSize * lineHeight;
	}

	// Create a temporary canvas to measure text
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		// Fallback calculation
		const explicitLines = content.split("\n").length;
		return {
			lines: explicitLines,
			requiredHeight: explicitLines * lineHeightPx + padding * 2,
			lineHeight: lineHeightPx,
		};
	}

	ctx.font = `${fontSize}px ${fontFamily}`;

	// Calculate available width for text (minus padding)
	const availableWidth = width - padding * 2;

	// Split content by explicit line breaks first
	const paragraphs = content.split("\n");
	let totalLines = 0;

	for (const paragraph of paragraphs) {
		if (paragraph.trim() === "") {
			// Empty line
			totalLines += 1;
			continue;
		}

		// Calculate word wrapping for this paragraph
		const words = paragraph.split(" ");
		let currentLine = "";
		let linesInParagraph = 0;

		for (const word of words) {
			const testLine = currentLine ? `${currentLine} ${word}` : word;
			const metrics = ctx.measureText(testLine);

			if (metrics.width > availableWidth && currentLine !== "") {
				// Word doesn't fit, start new line
				linesInParagraph += 1;
				currentLine = word;
			} else {
				currentLine = testLine;
			}
		}

		// Add the last line if there's content
		if (currentLine) {
			linesInParagraph += 1;
		}

		totalLines += Math.max(1, linesInParagraph);
	}

	const requiredHeight = totalLines * lineHeightPx + padding * 2;

	return {
		lines: totalLines,
		requiredHeight: Math.ceil(requiredHeight),
		lineHeight: lineHeightPx,
	};
}

export function getMinimumTextHeight(
	fontSize: number,
	lineHeight: string | number,
	padding = 8,
): number {
	let lineHeightPx: number;
	if (typeof lineHeight === "string") {
		if (lineHeight.includes("px")) {
			lineHeightPx = Number.parseFloat(lineHeight);
		} else {
			lineHeightPx = fontSize * Number.parseFloat(lineHeight);
		}
	} else {
		lineHeightPx = fontSize * lineHeight;
	}

	return lineHeightPx + padding * 2;
}

/**
 * Apply grayscale effect to a single image element based on percentage
 */
export const applyGrayscaleToImage = async (
	imgElement: HTMLImageElement,
	grayscalePercent: number,
): Promise<string> => {
	// If no grayscale or 0%, return original
	if (!grayscalePercent || grayscalePercent === 0) {
		return imgElement.src;
	}

	// Wait for image to be fully loaded
	if (!imgElement.complete) {
		await new Promise((resolve) => {
			imgElement.onload = resolve;
			imgElement.onerror = resolve;
		});
	}

	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");

	if (!ctx) return imgElement.src;

	// Set canvas size to match natural image dimensions
	canvas.width = imgElement.naturalWidth || imgElement.width;
	canvas.height = imgElement.naturalHeight || imgElement.height;

	// Draw original image to canvas
	ctx.drawImage(imgElement, 0, 0);

	// Get pixel data
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const data = imageData.data;

	// Calculate grayscale factor (0 to 1)
	const factor = Math.min(100, Math.max(0, grayscalePercent)) / 100;

	// Apply grayscale to each pixel
	for (let i = 0; i < data.length; i += 4) {
		// Calculate grayscale value using luminosity method
		const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

		// Blend between original color and grayscale based on percentage
		data[i] = data[i] * (1 - factor) + gray * factor; // red
		data[i + 1] = data[i + 1] * (1 - factor) + gray * factor; // green
		data[i + 2] = data[i + 2] * (1 - factor) + gray * factor; // blue
		// data[i + 3] is alpha (unchanged)
	}

	// Put modified pixel data back
	ctx.putImageData(imageData, 0, 0);

	// Return as data URL
	return canvas.toDataURL("image/png");
};

/**
 * Prepare canvas for export by applying grayscale to images
 * Returns cleanup function to restore original sources
 */
export const prepareCanvasForExport = async (
	canvasRef: HTMLDivElement,
	template: TemplateData,
): Promise<() => void> => {
	// Store reference to actual DOM elements and their original data
	const processedElements = new Map<
		HTMLImageElement,
		{
			originalSrc: string;
			originalFilter: string;
			imageId: string;
		}
	>();

	// Get all img elements in canvas
	const allImages = Array.from(
		canvasRef.querySelectorAll("img"),
	) as HTMLImageElement[];

	// Process each image element that needs grayscale
	for (const imageElement of template.images) {
		if (!imageElement.grayscalePercent || imageElement.grayscalePercent === 0) {
			continue;
		}

		// Find matching img element by src
		// Important: Find the EXACT element, not just any with matching src
		const imgEl = allImages.find((img) => {
			// Match by original src
			if (img.src === imageElement.src) {
				// Make sure we haven't processed this element yet
				return !processedElements.has(img);
			}
			return false;
		});

		if (imgEl?.complete) {
			// Store original data with reference to the actual DOM element
			processedElements.set(imgEl, {
				originalSrc: imgEl.src,
				originalFilter: imgEl.style.filter || "",
				imageId: imageElement.id,
			});

			// Mark element with unique ID for tracking
			imgEl.setAttribute("data-grayscale-id", imageElement.id);

			// Remove CSS filter to avoid double application
			imgEl.style.filter = "none";

			try {
				// Apply grayscale and replace src
				const grayscaledSrc = await applyGrayscaleToImage(
					imgEl,
					imageElement.grayscalePercent,
				);

				// Replace image source
				imgEl.src = grayscaledSrc;

				// Wait for new image to load
				if (!imgEl.complete) {
					await new Promise((resolve) => {
						imgEl.onload = resolve;
						imgEl.onerror = resolve;
						setTimeout(resolve, 100);
					});
				}
			} catch (error) {
				console.error(
					`Failed to apply grayscale to ${imageElement.id}:`,
					error,
				);
			}
		}
	}

	// Wait a bit for all images to settle
	await new Promise((resolve) => setTimeout(resolve, 50));

	// Return cleanup function to restore originals
	return () => {
		// Restore each processed element using the Map reference
		processedElements.forEach((data, imgEl) => {
			// Restore original src and filter
			imgEl.src = data.originalSrc;
			imgEl.style.filter = data.originalFilter;

			// Remove tracking attribute
			imgEl.removeAttribute("data-grayscale-id");
		});

		// Clear the map
		processedElements.clear();
	};
};
