import type {
	ImageElement,
	LineElement,
	ShapeElement,
	TemplateData,
	TextElement,
} from "../types/template";

/**
 * Load an image and return it as HTMLImageElement
 */
async function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = src;
	});
}

/**
 * Apply grayscale effect to image
 */
function applyGrayscale(
	ctx: CanvasRenderingContext2D,
	img: HTMLImageElement,
	grayscalePercent: number,
): HTMLCanvasElement {
	const tempCanvas = document.createElement("canvas");
	const tempCtx = tempCanvas.getContext("2d");
	if (!tempCtx) return tempCanvas;

	tempCanvas.width = img.naturalWidth || img.width;
	tempCanvas.height = img.naturalHeight || img.height;

	tempCtx.drawImage(img, 0, 0);

	const imageData = tempCtx.getImageData(
		0,
		0,
		tempCanvas.width,
		tempCanvas.height,
	);
	const data = imageData.data;
	const factor = Math.min(100, Math.max(0, grayscalePercent)) / 100;

	for (let i = 0; i < data.length; i += 4) {
		const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
		data[i] = data[i] * (1 - factor) + gray * factor;
		data[i + 1] = data[i + 1] * (1 - factor) + gray * factor;
		data[i + 2] = data[i + 2] * (1 - factor) + gray * factor;
	}

	tempCtx.putImageData(imageData, 0, 0);
	return tempCanvas;
}

/**
 * Draw an image element to canvas
 */
async function drawImage(
	ctx: CanvasRenderingContext2D,
	element: ImageElement,
): Promise<void> {
	try {
		const img = await loadImage(element.src);

		ctx.save();

		// Apply rotation
		if (element.rotate) {
			ctx.translate(
				element.position.x + element.width / 2,
				element.position.y + element.height / 2,
			);
			ctx.rotate((element.rotate * Math.PI) / 180);
			ctx.translate(
				-(element.position.x + element.width / 2),
				-(element.position.y + element.height / 2),
			);
		}

		// Apply border radius if needed
		if (element.borderRadius) {
			ctx.beginPath();
			const radius = element.borderRadius;
			const x = element.position.x;
			const y = element.position.y;
			const w = element.width;
			const h = element.height;

			ctx.moveTo(x + radius, y);
			ctx.lineTo(x + w - radius, y);
			ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
			ctx.lineTo(x + w, y + h - radius);
			ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
			ctx.lineTo(x + radius, y + h);
			ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
			ctx.lineTo(x, y + radius);
			ctx.quadraticCurveTo(x, y, x + radius, y);
			ctx.closePath();
			ctx.clip();
		}

		// Calculate source rectangle for cropping/scaling
		const scaleX = element.scaleX || 1;
		const scaleY = element.scaleY || 1;
		const offsetX = element.imageOffset?.x || 0;
		const offsetY = element.imageOffset?.y || 0;

		const sourceWidth = img.naturalWidth || img.width;
		const sourceHeight = img.naturalHeight || img.height;

		// Apply grayscale if needed
		if (element.grayscalePercent && element.grayscalePercent > 0) {
			const grayscaledCanvas = applyGrayscale(
				ctx,
				img,
				element.grayscalePercent,
			);
			ctx.drawImage(
				grayscaledCanvas,
				offsetX,
				offsetY,
				sourceWidth / scaleX,
				sourceHeight / scaleY,
				element.position.x,
				element.position.y,
				element.width,
				element.height,
			);
		} else {
			ctx.drawImage(
				img,
				offsetX,
				offsetY,
				sourceWidth / scaleX,
				sourceHeight / scaleY,
				element.position.x,
				element.position.y,
				element.width,
				element.height,
			);
		}

		ctx.restore();
	} catch (error) {
		console.error(`Failed to draw image ${element.id}:`, error);
	}
}

/**
 * Draw curved text
 */
function drawCurvedText(
	ctx: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	width: number,
	curveRadius: number,
	curveDirection: "up" | "down",
): void {
	const chars = text.split("");
	const totalAngle = width / curveRadius;
	const startAngle =
		curveDirection === "up" ? -totalAngle / 2 : Math.PI + totalAngle / 2;

	ctx.save();
	for (let i = 0; i < chars.length; i++) {
		const char = chars[i];
		const charWidth = ctx.measureText(char).width;
		const angle = startAngle + (i * totalAngle) / chars.length;

		ctx.save();
		ctx.translate(x + width / 2, y);
		ctx.rotate(angle);
		ctx.translate(0, curveDirection === "up" ? -curveRadius : curveRadius);
		if (curveDirection === "down") {
			ctx.rotate(Math.PI);
		}
		ctx.fillText(char, -charWidth / 2, 0);

		// Draw stroke if needed
		if (ctx.lineWidth > 0) {
			ctx.strokeText(char, -charWidth / 2, 0);
		}

		ctx.restore();
	}
	ctx.restore();
}

/**
 * Draw a text element to canvas
 */
function drawText(ctx: CanvasRenderingContext2D, element: TextElement): void {
	ctx.save();

	// Apply rotation
	if (element.rotate) {
		ctx.translate(
			element.position.x + element.width / 2,
			element.position.y + element.height / 2,
		);
		ctx.rotate((element.rotate * Math.PI) / 180);
		ctx.translate(
			-(element.position.x + element.width / 2),
			-(element.position.y + element.height / 2),
		);
	}

	// Draw background if specified
	if (element.style.backgroundColor) {
		const borderRadius = element.style.borderRadius || 0;
		if (borderRadius > 0) {
			ctx.beginPath();
			const x = element.position.x;
			const y = element.position.y;
			const w = element.width;
			const h = element.height;
			const r = borderRadius;

			ctx.moveTo(x + r, y);
			ctx.lineTo(x + w - r, y);
			ctx.quadraticCurveTo(x + w, y, x + w, y + r);
			ctx.lineTo(x + w, y + h - r);
			ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
			ctx.lineTo(x + r, y + h);
			ctx.quadraticCurveTo(x, y + h, x, y + h - r);
			ctx.lineTo(x, y + r);
			ctx.quadraticCurveTo(x, y, x + r, y);
			ctx.closePath();
			ctx.fillStyle = element.style.backgroundColor;
			ctx.fill();
		} else {
			ctx.fillStyle = element.style.backgroundColor;
			ctx.fillRect(
				element.position.x,
				element.position.y,
				element.width,
				element.height,
			);
		}
	}

	// Set font properties
	const fontSize =
		typeof element.style.fontSize === "number"
			? element.style.fontSize
			: Number.parseFloat(element.style.fontSize);
	const fontWeight = element.style.fontWeight || "normal";
	const fontFamily = element.style.fontFamily || "Arial, sans-serif";

	ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
	ctx.fillStyle = element.style.color;
	ctx.textBaseline = "top";

	// Text stroke/outline
	if (element.style.WebkitTextStroke || element.style.textStroke) {
		const strokeParts = (
			element.style.WebkitTextStroke || element.style.textStroke
		)?.split(" ");
		if (strokeParts && strokeParts.length >= 2) {
			ctx.lineWidth = Number.parseFloat(strokeParts[0]);
			ctx.strokeStyle = strokeParts.slice(1).join(" ");
		}
	} else if (element.style.outlineWidth && element.style.outlineColor) {
		ctx.lineWidth = element.style.outlineWidth;
		ctx.strokeStyle = element.style.outlineColor;
	}

	// Letter spacing
	if (element.style.letterSpacing) {
		const spacing =
			typeof element.style.letterSpacing === "number"
				? element.style.letterSpacing
				: Number.parseFloat(element.style.letterSpacing);
		ctx.letterSpacing = `${spacing}px`;
	}

	// Calculate padding
	const padding =
		typeof element.style.padding === "number"
			? element.style.padding
			: Number.parseFloat(element.style.padding || "8");

	// Handle curved text
	if (element.style.curved && element.style.curveRadius) {
		drawCurvedText(
			ctx,
			element.content,
			element.position.x,
			element.position.y,
			element.width,
			element.style.curveRadius,
			element.style.curveDirection || "up",
		);
	} else {
		// Draw normal text with wrapping and alignment
		const lines = element.content.split("\n");
		const lineHeight =
			typeof element.style.lineHeight === "string"
				? fontSize * Number.parseFloat(element.style.lineHeight)
				: fontSize * element.style.lineHeight;

		const textAlign = element.style.textAlign || "left";
		const verticalAlign = element.style.verticalAlign || "top";

		// Calculate vertical offset based on vertical alignment
		let verticalOffset = padding;
		const totalTextHeight = lines.length * lineHeight;
		if (verticalAlign === "middle") {
			verticalOffset = (element.height - totalTextHeight) / 2;
		} else if (verticalAlign === "bottom") {
			verticalOffset = element.height - totalTextHeight - padding;
		}

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const y = element.position.y + verticalOffset + i * lineHeight;

			// Calculate horizontal offset based on text alignment
			let x = element.position.x + padding;
			const textWidth = ctx.measureText(line).width;

			if (textAlign === "center") {
				x = element.position.x + (element.width - textWidth) / 2;
			} else if (textAlign === "right") {
				x = element.position.x + element.width - textWidth - padding;
			}

			// Draw stroke first, then fill
			if (ctx.lineWidth > 0) {
				ctx.strokeText(line, x, y);
			}
			ctx.fillText(line, x, y);
		}
	}

	ctx.restore();
}

/**
 * Draw a shape element to canvas
 */
function drawShape(ctx: CanvasRenderingContext2D, element: ShapeElement): void {
	ctx.save();

	// Apply rotation
	if (element.rotation) {
		ctx.translate(
			element.position.x + element.width / 2,
			element.position.y + element.height / 2,
		);
		ctx.rotate((element.rotation * Math.PI) / 180);
		ctx.translate(
			-(element.position.x + element.width / 2),
			-(element.position.y + element.height / 2),
		);
	}

	ctx.globalAlpha = element.opacity || 1;
	ctx.fillStyle = element.fill;
	ctx.strokeStyle = element.borderColor;
	ctx.lineWidth = element.borderWidth || 0;

	const x = element.position.x;
	const y = element.position.y;
	const w = element.width;
	const h = element.height;

	switch (element.variant) {
		case "rectangle": {
			if (element.borderRadius > 0) {
				const r = element.borderRadius;
				ctx.beginPath();
				ctx.moveTo(x + r, y);
				ctx.lineTo(x + w - r, y);
				ctx.quadraticCurveTo(x + w, y, x + w, y + r);
				ctx.lineTo(x + w, y + h - r);
				ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
				ctx.lineTo(x + r, y + h);
				ctx.quadraticCurveTo(x, y + h, x, y + h - r);
				ctx.lineTo(x, y + r);
				ctx.quadraticCurveTo(x, y, x + r, y);
				ctx.closePath();
			} else {
				ctx.beginPath();
				ctx.rect(x, y, w, h);
			}
			break;
		}
		case "circle": {
			ctx.beginPath();
			ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
			break;
		}
		case "triangle": {
			ctx.beginPath();
			ctx.moveTo(x + w / 2, y);
			ctx.lineTo(x + w, y + h);
			ctx.lineTo(x, y + h);
			ctx.closePath();
			break;
		}
	}

	ctx.fill();
	if (element.borderWidth > 0) {
		ctx.stroke();
	}

	ctx.restore();
}

/**
 * Draw line tip (arrow, circle, etc.)
 */
function drawLineTip(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	angle: number,
	tip: string,
	strokeWidth: number,
): void {
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(angle);

	const size = strokeWidth * 3;

	switch (tip) {
		case "arrow": {
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(-size, -size / 2);
			ctx.lineTo(-size, size / 2);
			ctx.closePath();
			ctx.fill();
			break;
		}
		case "circle": {
			ctx.beginPath();
			ctx.arc(0, 0, size / 2, 0, 2 * Math.PI);
			ctx.fill();
			break;
		}
		case "square": {
			ctx.fillRect(-size / 2, -size / 2, size, size);
			break;
		}
		case "rounded": {
			ctx.beginPath();
			ctx.arc(0, 0, strokeWidth / 2, 0, 2 * Math.PI);
			ctx.fill();
			break;
		}
	}

	ctx.restore();
}

/**
 * Draw a line element to canvas
 */
function drawLine(ctx: CanvasRenderingContext2D, element: LineElement): void {
	ctx.save();

	ctx.globalAlpha = element.opacity || 1;
	ctx.strokeStyle = element.strokeColor;
	ctx.lineWidth = element.strokeWidth;

	// Set line style based on variant
	if (element.variant === "line-dashed") {
		ctx.setLineDash([10, 5]);
	} else if (element.variant === "line-dotted") {
		ctx.setLineDash([2, 5]);
	} else if (element.variant === "line-rounded") {
		ctx.lineCap = "round";
	}

	// Draw line
	ctx.beginPath();
	ctx.moveTo(element.startPoint.x, element.startPoint.y);
	ctx.lineTo(element.endPoint.x, element.endPoint.y);
	ctx.stroke();

	// Draw tips
	ctx.fillStyle = element.strokeColor;

	const angle = Math.atan2(
		element.endPoint.y - element.startPoint.y,
		element.endPoint.x - element.startPoint.x,
	);

	if (element.startTip && element.startTip !== "none") {
		drawLineTip(
			ctx,
			element.startPoint.x,
			element.startPoint.y,
			angle + Math.PI,
			element.startTip,
			element.strokeWidth,
		);
	}

	if (element.endTip && element.endTip !== "none") {
		drawLineTip(
			ctx,
			element.endPoint.x,
			element.endPoint.y,
			angle,
			element.endTip,
			element.strokeWidth,
		);
	}

	ctx.restore();
}

/**
 * Render a template to an HTML5 canvas and return data URL
 */
export async function renderTemplateToCanvas(
	template: TemplateData,
): Promise<string> {
	const canvas = document.createElement("canvas");
	canvas.width = template.width;
	canvas.height = template.height;

	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Failed to get canvas context");
	}

	// Draw background
	ctx.fillStyle = template.backgroundColor;
	ctx.fillRect(0, 0, template.width, template.height);

	// Draw background image if present
	if (template.backgroundImage) {
		try {
			const bgImg = await loadImage(template.backgroundImage);
			ctx.drawImage(bgImg, 0, 0, template.width, template.height);
		} catch (error) {
			console.error("Failed to load background image:", error);
		}
	}

	// Get all elements sorted by layer order
	const allElements: Array<{
		element: ImageElement | TextElement | ShapeElement | LineElement;
		type: "image" | "text" | "shape" | "line";
	}> = [
		...template.images.map((e) => ({ element: e, type: "image" as const })),
		...template.texts.map((e) => ({ element: e, type: "text" as const })),
		...template.shapes.map((e) => ({ element: e, type: "shape" as const })),
		...template.lines.map((e) => ({ element: e, type: "line" as const })),
	];

	// Sort by layer order
	allElements.sort((a, b) => {
		const aIndex = template.layer.indexOf(a.element.id);
		const bIndex = template.layer.indexOf(b.element.id);
		return aIndex - bIndex;
	});

	// Draw each element
	for (const { element, type } of allElements) {
		switch (type) {
			case "image":
				await drawImage(ctx, element as ImageElement);
				break;
			case "text":
				drawText(ctx, element as TextElement);
				break;
			case "shape":
				drawShape(ctx, element as ShapeElement);
				break;
			case "line":
				drawLine(ctx, element as LineElement);
				break;
		}
	}

	// Return data URL
	return canvas.toDataURL("image/png");
}

/**
 * Render template to canvas and trigger download
 */
export async function downloadTemplateAsImage(
	template: TemplateData,
	filename = "template-preview.png",
): Promise<void> {
	const dataURL = await renderTemplateToCanvas(template);

	const link = document.createElement("a");
	link.href = dataURL;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}
