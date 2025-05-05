export interface Position {
  x: number;
  y: number;
}

export interface ImageElement {
  id: string;
  type: "image";
  src: string;
  position: Position;
  width: number;
  height: number;
}

export interface TextElement {
  id: string;
  type: "text";
  content: string;
  position: Position;
  style: {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    color: string;
    textAlign: string;
    lineHeight: string;
    curved?: boolean;
    curveRadius?: number;
    curveDirection?: "up" | "down";
    rotate?: number;
    centerX?: boolean;
    maxWidth?: number|string;
  };
}

export interface TemplateData {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  backgroundImage?: string;
  images: ImageElement[];
  texts: TextElement[];
}

export type PrintSize = "10x20" | "15x20" | "20x30";

export interface PrintSizeConfig {
  name: PrintSize;
  width: number;
  height: number;
  label: string;
}
