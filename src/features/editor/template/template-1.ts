import { fontFamily } from "@/shared/lib/font";
import type { TemplateData } from "@/shared/types/template";

export const template1: TemplateData = {
	id: "minimalist-graduation",
	name: "Minimalist Graduation",
	width: 600,
	height: 800,
	backgroundColor: "#ffffff",
	images: [
		{
			id: "image-1",
			type: "image",
			src: "/placeholder.png",
			position: { x: 100, y: 235 },
			width: 400,
			height: 400,
		},
	],
	texts: [
		{
			id: "text-1",
			type: "text",
			content: "･Happy･",
			position: { x: 190, y: 130 },
			style: {
				fontFamily: fontFamily.moreSugar,
				fontSize: "18px",
				fontWeight: "normal",
				color: "#000000",
				textAlign: "center",
				lineHeight: "1.2",
				letterSpacing: "6px",
				curved: true,
				curveRadius: 10,
				curveDirection: "down",
				rotate: -25,
			},
		},
		{
			id: "text-2",
			type: "text",
			content: "Graduation",
			position: { x: 300, y: 95 },
			style: {
				fontFamily: fontFamily.flatlion,
				fontSize: "90px ",
				fontWeight: "normal",
				color: "#000000",
				textAlign: "center",
				lineHeight: "1.2",
				centerX: true,
			},
		},
		{
			id: "text-3",
			type: "text",
			content: "name",
			position: { x: 300, y: 195 },
			style: {
				fontFamily: fontFamily.moreSugar,
				fontSize: "20px",
				fontWeight: "normal",
				color: "#000000",
				textAlign: "center",
				lineHeight: "1.2",
				centerX: true,
			},
		},
		{
			id: "text-4",
			type: "text",
			content:
				"thank you for being a good person and\nthe most comfortable place to tell stories.",
			position: { x: 300, y: 650 },
			style: {
				fontFamily: fontFamily.mungil,
				fontSize: "14px",
				fontWeight: "normal",
				color: "#000000",
				textAlign: "center",
				lineHeight: "1.5",
				centerX: true,
				maxWidth: 300,
			},
		},
	],
};
