import { template1 } from "@/features/editor/template/template-1";
import { template5 } from "@/features/editor/template/template-5";
import type { PrintSizeConfig, TemplateData } from "../types/template";

// Registry of all available templates
export const templateRegistry = {
  default: template1,
  1: template1,
  5: template5,
};

export type TemplateType = keyof typeof templateRegistry;



// Create templates for different print sizes
export function getTemplateForSize(
  size: PrintSizeConfig,
  templateType: TemplateType = "default"
): TemplateData {
  const baseTemplate = templateRegistry[templateType];
  if (!baseTemplate) {
    throw new Error(`Template type "${templateType}" not found`);
  }

  const template = { ...baseTemplate };
  template.width = size.width;
  template.height = size.height;

  // Adjust positions based on new dimensions
  const scaleX = size.width / baseTemplate.width;
  const scaleY = size.height / baseTemplate.height;

  // Scale image positions and sizes
  template.images = template.images.map((img) => ({
    ...img,
    position: {
      x: img.position.x * scaleX,
      y: img.position.y * scaleY,
    },
    width: img.width * scaleX,
    height: img.height * scaleY,
  }));

  // Scale text positions
  template.texts = template.texts.map((text) => ({
    ...text,
    position: {
      x: text.position.x * scaleX,
      y: text.position.y * scaleY,
    },
    style: {
      ...text.style,
      fontSize: `${
        Number.parseInt(text.style.fontSize) * Math.min(scaleX, scaleY)
      }px`,
    },
  }));

  return template;
}

// Export print sizes
export const printSizes: PrintSizeConfig[] = [
  {
    name: "10x20",
    width: 400,
    height: 800,
    label: "10x20 cm",
  },
  {
    name: "15x20",
    width: 600,
    height: 800,
    label: "15x20 cm",
  },
  {
    name: "20x30",
    width: 800,
    height: 1200,
    label: "20x30 cm",
  },
];
