import type { TemplateData } from "@/shared/types/template";

export const template5: TemplateData = {
  id: "graduation-template",
  name: "Graduation Template",
  width: 800,
  height: 1000,
  backgroundColor: "#ffffff",
  images: [
    {
      id: "image-1",
      type: "image",
      src: "/placeholder.png",
      position: { x: 50, y: 50 },
      width: 350,
      height: 350,
    },
    {
      id: "image-2",
      type: "image",
      src: "/placeholder.png",
      position: { x: 400, y: 50 },
      width: 350,
      height: 350,
    },
    {
      id: "image-3",
      type: "image",
      src: "/placeholder.png",
      position: { x: 50, y: 400 },
      width: 350,
      height: 350,
    },
    {
      id: "image-4",
      type: "image",
      src: "/placeholder.png",
      position: { x: 400, y: 400 },
      width: 350,
      height: 350,
    },
  ],
  texts: [
    {
      id: "text-1",
      type: "text",
      content: "Happy Graduation",
      position: { x: 250, y: 780 },
      style: {
        fontFamily: "Georgia, serif",
        fontSize: "48px",
        fontWeight: "bold",
        color: "#000000",
        textAlign: "center",
        lineHeight: "1.2",
      },
    },
    {
      id: "text-2",
      type: "text",
      content: "Graduate Name ♥",
      position: { x: 300, y: 850 },
      style: {
        fontFamily: "Arial, sans-serif",
        fontSize: "24px",
        fontWeight: "normal",
        color: "#000000",
        textAlign: "center",
        lineHeight: "1.2",
      },
    },
    {
      id: "text-3",
      type: "text",
      content:
        "Congratulation you have completed your first step well and good luck for the next step of your journey.",
      position: { x: 150, y: 900 },
      style: {
        fontFamily: "Arial, sans-serif",
        fontSize: "16px",
        fontWeight: "normal",
        color: "#000000",
        textAlign: "center",
        lineHeight: "1.5",
      },
    },
  ],
};
