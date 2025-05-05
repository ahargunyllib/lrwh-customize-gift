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
      position: { x: 100, y: 260 },
      width: 400,
      height: 400,
    },
  ],
  texts: [
    {
      id: "text-1",
      type: "text",
      content: "･Happy･",
      position: { x: 150, y: 125 },
      style: {
        fontFamily: "'Segoe UI', sans-serif",
        fontSize: "20px",
        fontWeight: "bold",
        color: "#000000",
        textAlign: "center",
        lineHeight: "1.2",

        curved: true,
        curveRadius: 10,
        curveDirection: "down",
        rotate: -35,
      },
    },
    {
      id: "text-2",
      type: "text",
      content: "Graduation",
      position: { x: 300, y: 130 },
      style: {
        fontFamily: "Georgia, serif",
        fontSize: "48px",
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
      position: { x: 300, y: 200 },
      style: {
        fontFamily: "'Segoe UI', sans-serif",
        fontSize: "18px",
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
      position: { x: 300, y: 700 },
      style: {
        fontFamily: "'Segoe UI', sans-serif",
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
