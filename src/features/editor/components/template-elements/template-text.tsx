"use client";
import { useEffect, useState } from "react";
import type React from "react";

import { Input } from "@/shared/components/ui/input";
import type { TextElement } from "@/shared/types/template";

interface TemplateTextProps {
	text: TextElement;
	isActive: boolean;
	isEditing: boolean;
	onClick: (e: React.MouseEvent) => void;
	onDoubleClick: () => void;
	onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onInputBlur: () => void;
	onInputKeyDown: (e: React.KeyboardEvent) => void;
	scale?: number;
	getSnapPosition?: (
		position: { x: number; y: number },
		width: number,
		height: number,
	) => { x: number; y: number };
	constrainToCanvas?: (
		position: { x: number; y: number },
		width: number,
		height: number,
	) => { x: number; y: number };
	isSnapping?: boolean;
	canvasWidth?: number;
	canvasHeight?: number;
}

export default function TemplateText({
	text,
	isActive,
	isEditing,
	onClick,
	onDoubleClick,
	onInputChange,
	onInputBlur,
	onInputKeyDown,
	scale = 1,
	getSnapPosition,
	constrainToCanvas,
	isSnapping = false,
	canvasWidth = 0,
	canvasHeight = 0,
}: TemplateTextProps) {
	const {
		curved,
		curveRadius = 100,
		curveDirection = "up",
		rotate = 0,
		centerX = false,
		centerY = false,
		maxWidth,
		height,
		backgroundColor,
		borderRadius,
		padding,
		paddingTop,
		paddingRight,
		paddingBottom,
		paddingLeft,
		paddingX,
		paddingY,
		paddingCenter,
		letterSpacing,
	} = text.style;

	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

	const fontSizeNum =
		typeof text.style.fontSize === "string"
			? Number.parseFloat(text.style.fontSize)
			: text.style.fontSize;

	const approxWidth = text.content.length * (fontSizeNum * 0.6);
	const approxHeight = fontSizeNum * 1.5; // Approximate height based on font size
	const sweepFlag = curveDirection === "up" ? 0 : 1;

	const computedPadding: React.CSSProperties = {
		padding,
		paddingTop: paddingTop ?? paddingY,
		paddingBottom: paddingBottom ?? paddingY,
		paddingLeft: paddingLeft ?? paddingX,
		paddingRight: paddingRight ?? paddingX,
	};

	const getWrapperStyle = (): React.CSSProperties => {
		const style: React.CSSProperties = {
			position: "absolute",
			transform: `rotate(${rotate}deg)`,
			transformOrigin: "center center",
		};

		if (centerX) {
			style.left = 0;
			style.right = 0;
			style.textAlign = "center";
		} else {
			style.left = text.position.x;
		}

		if (centerY && canvasHeight) {
			style.top = canvasHeight / 2;
		} else {
			style.top = text.position.y;
		}

		return style;
	};

	const contentWrapperStyle: React.CSSProperties = {
		display: "inline-block",
		fontFamily: text.style.fontFamily,
		fontSize: fontSizeNum,
		fontWeight: text.style.fontWeight,
		color: text.style.color,
		backgroundColor,
		borderRadius,
		height,
		maxWidth: maxWidth ?? undefined,
		lineHeight: text.style.lineHeight,
		textAlign: text.style.textAlign as React.CSSProperties["textAlign"],
		whiteSpace: "pre-wrap",
		overflowWrap: "break-word",
		letterSpacing,
		...computedPadding,
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		if (text.draggable && !isEditing) {
			e.preventDefault();
			const rect = e.currentTarget.getBoundingClientRect();
			setDragOffset({
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			});
			setIsDragging(true);
		}
	};

	useEffect(() => {
		if (!isDragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			if (isDragging) {
				const canvas = document.querySelector('[data-canvas="true"]');
				if (canvas) {
					const canvasRect = canvas.getBoundingClientRect();
					const newX = (e.clientX - canvasRect.left - dragOffset.x) / scale;
					const newY = (e.clientY - canvasRect.top - dragOffset.y) / scale;

					let newPosition = { x: newX, y: newY };

					const isMovingSlowly =
						e.movementX * e.movementX + e.movementY * e.movementY < 25;
					if (getSnapPosition && isSnapping && isMovingSlowly) {
						newPosition = getSnapPosition(
							newPosition,
							approxWidth,
							approxHeight,
						);
					}

					if (constrainToCanvas) {
						newPosition = constrainToCanvas(
							newPosition,
							approxWidth,
							approxHeight,
						);
					}

					document.dispatchEvent(
						new CustomEvent("elementMove", {
							detail: {
								id: text.id,
								type: "text",
								position: newPosition,
							},
						}),
					);
				}
			}
		};

		const handleMouseUp = () => {
			setIsDragging(false);
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [
		isDragging,
		dragOffset,
		text.id,
		scale,
		getSnapPosition,
		constrainToCanvas,
		isSnapping,
		approxWidth,
		approxHeight,
	]);

	return (
		<div
			className={isActive ? "ring-2 ring-blue-500 absolute" : "absolute"}
			style={getWrapperStyle()}
			onClick={(e) => {
				e.stopPropagation();
				onClick(e);
			}}
			onKeyDown={(e) => {
				if (!isEditing && e.key === "Enter") {
					e.preventDefault();
					onClick(e as unknown as React.MouseEvent);
				}
			}}
			onDoubleClick={(e) => {
				e.stopPropagation();
				onDoubleClick();
			}}
			onMouseDown={handleMouseDown}
		>
			{isEditing ? (
				<Input
					value={text.content}
					onChange={onInputChange}
					onBlur={onInputBlur}
					onKeyDown={onInputKeyDown}
					autoFocus
					className="min-w-[200px]"
					style={contentWrapperStyle}
				/>
			) : (
				<div style={contentWrapperStyle}>
					{curved ? (
						// biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
						<svg
							width={approxWidth + 2}
							height={curveRadius + fontSizeNum}
							viewBox={`0 -${curveRadius} ${approxWidth + 2} ${curveRadius + fontSizeNum}`}
							style={{ overflow: "visible" }}
							aria-label={text.content}
						>
							<defs>
								<path
									id={`curve-path-${text.id}`}
									d={`M 0,0 A ${curveRadius},${curveRadius} 0 0,${sweepFlag} ${approxWidth},0`}
								/>
							</defs>
							<text
								fontFamily={text.style.fontFamily}
								fontSize={fontSizeNum}
								fontWeight={text.style.fontWeight}
								fill={text.style.color}
								style={{ letterSpacing }}
							>
								<textPath
									href={`#curve-path-${text.id}`}
									startOffset="50%"
									textAnchor="middle"
								>
									{text.content}
								</textPath>
							</text>
						</svg>
					) : (
						text.content
					)}
				</div>
			)}
		</div>
	);
}
