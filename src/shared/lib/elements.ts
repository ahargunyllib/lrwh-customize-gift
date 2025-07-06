import type { TextElement } from "../types/template";

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
