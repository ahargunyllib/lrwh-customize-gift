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
}: TemplateTextProps) {
	const {
		curved,
		curveRadius = 100,
		curveDirection = "up",
		rotate = 0,
		centerX = false,
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
	const sweepFlag = curveDirection === "up" ? 0 : 1;

	const computedPadding: React.CSSProperties = {
		padding,
		paddingTop: paddingTop ?? paddingY,
		paddingBottom: paddingBottom ?? paddingY,
		paddingLeft: paddingLeft ?? paddingX,
		paddingRight: paddingRight ?? paddingX,
	};

	const wrapperStyle: React.CSSProperties = {
		position: "absolute",
		top: text.position.y,
		transform: `rotate(${rotate}deg)`,
		transformOrigin: "center center",
		...(centerX || paddingCenter
			? { left: 0, right: 0, textAlign: "center" as const }
			: { left: text.position.x }),
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

					document.dispatchEvent(
						new CustomEvent("elementMove", {
							detail: {
								id: text.id,
								type: "text",
								position: { x: newX, y: newY },
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
	}, [isDragging, dragOffset, text.id, scale]);

	return (
		<div
			className={isActive ? "ring-2 ring-blue-500 absolute" : "absolute"}
			style={wrapperStyle}
			onClick={(e) => {
				e.stopPropagation();
				onClick(e);
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
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
