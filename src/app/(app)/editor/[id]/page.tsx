"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { ImageIcon, Type, Layout, Printer } from "lucide-react";
import EditorCanvas from "@/features/editor/components/editor-canvas";
import ImageUploader from "@/features/editor/components/image-uploader";
import TextEditor from "@/features/editor/components/text-editor";
import {
  printSizes,
  getTemplateForSize,
  type TemplateType,
} from "@/shared/lib/template";
import type { TemplateData, PrintSizeConfig } from "@/shared/types/template";
import html2canvas from "html2canvas";

export default function TemplateEditorPage() {
  const params = useParams();
  const templateId = params.id as TemplateType;

  const [selectedSize, setSelectedSize] = useState<PrintSizeConfig>(
    printSizes[1]
  ); // Default to 10x15
  const [template, setTemplate] = useState<TemplateData>(() =>
    getTemplateForSize(selectedSize, templateId as TemplateType)
  );
  const [activeElement, setActiveElement] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Update scale when window resizes or template size changes
  useEffect(() => {
    const updateScale = () => {
      if (canvasContainerRef.current) {
        const containerWidth = canvasContainerRef.current.clientWidth - 32; // Subtract padding
        const templateWidth = template.width;
        const newScale = Math.min(1, containerWidth / templateWidth);
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [template.width, canvasContainerRef]);

  useEffect(() => {
    setTemplate(getTemplateForSize(selectedSize, templateId as TemplateType));
  }, [selectedSize, templateId]);

  useEffect(() => {
    const exportButton = document.getElementById("export-button");
    if (exportButton) {
      exportButton.addEventListener("click", exportAsImage);
    }
    return () => {
      if (exportButton) {
        exportButton.removeEventListener("click", exportAsImage);
      }
    };
  }, [canvasRef, scale]);

  useEffect(() => {
    const handleSizeChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      const size = customEvent.detail.size;
      const newSize = printSizes.find((s) => s.name === size);
      if (newSize) {
        setSelectedSize(newSize);
      }
    };

    document.addEventListener("printSizeChange", handleSizeChange);
    return () => {
      document.removeEventListener("printSizeChange", handleSizeChange);
    };
  }, []);

  const handleImageChange = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setTemplate((prev) => ({
          ...prev,
          images: prev.images.map((img) =>
            img.id === id ? { ...img, src: e.target?.result as string } : img
          ),
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTextChange = (id: string, value: string) => {
    setTemplate((prev) => ({
      ...prev,
      texts: prev.texts.map((text) =>
        text.id === id ? { ...text, content: value } : text
      ),
    }));
  };

  const handleTextStyleChange = (
    id: string,
    property: string,
    value: string
  ) => {
    setTemplate((prev) => ({
      ...prev,
      texts: prev.texts.map((text) =>
        text.id === id
          ? { ...text, style: { ...text.style, [property]: value } }
          : text
      ),
    }));
  };

  const exportAsImage = async () => {
    if (canvasRef.current) {
      try {
        const canvasClone = canvasRef.current.cloneNode(true) as HTMLElement;

        // Apply a fixed scale for export
        canvasClone.style.transform = "scale(1)";
        canvasClone.style.transformOrigin = "top left";

        // Temporarily append to the document but make it invisible
        canvasClone.style.position = "absolute";
        canvasClone.style.left = "-9999px";
        canvasClone.style.top = "-9999px";
        document.body.appendChild(canvasClone);

        // Convert OKLCH colors to RGB to avoid compatibility issues
        const elements = canvasClone.querySelectorAll("*");
        elements.forEach((el) => {
          const element = el as HTMLElement;
          // Replace any Tailwind classes that might use OKLCH colors
          if (element.className && typeof element.className === "string") {
            // Remove any Tailwind classes that might cause color issues
            const classesToRemove = [
              /bg-primary/g,
              /text-primary/g,
              /border-primary/g,
              /ring-primary/g,
              /fill-primary/g,
              /stroke-primary/g,
            ];

            classesToRemove.forEach((regex) => {
              element.className = element.className.replace(regex, "");
            });
          }

          // Ensure all colors are in a compatible format (hex, rgb, rgba)
          const style = window.getComputedStyle(element);
          const backgroundColor = style.backgroundColor;
          const color = style.color;

          if (backgroundColor) element.style.backgroundColor = backgroundColor;
          if (color) element.style.color = color;
        });

        // Use html2canvas with the modified clone
        const canvas = await html2canvas(canvasClone, {
          scale: 2, // Higher quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: template.backgroundColor,
          logging: false, // Disable logging
        });

        // Clean up the clone
        document.body.removeChild(canvasClone);

        // Create and download the image
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = `graduation-card-${selectedSize.name}.png`;
        link.click();
      } catch (error) {
        console.error("Export failed:", error);
        alert("Export failed. Please try again or use a different browser.");
      }
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-64 border-r bg-white text-black p-4 overflow-y-auto">
        <Tabs defaultValue="images" className="bg-white text-black">
          <TabsList className="grid w-full grid-cols-3 bg-white text-black">
            <TabsTrigger value="images">
              <ImageIcon className="h-4 w-4 mr-2" />
              Images
            </TabsTrigger>
            <TabsTrigger value="text">
              <Type className="h-4 w-4 mr-2" />
              Text
            </TabsTrigger>
            <TabsTrigger value="layout">
              <Layout className="h-4 w-4 mr-2" />
              Layout
            </TabsTrigger>
          </TabsList>
          <TabsContent value="images" className="space-y-4 mt-4">
            <h3 className="font-medium">Replace Images</h3>
            <div className="space-y-3">
              {template.images.map((image) => (
                <ImageUploader
                  key={image.id}
                  image={image}
                  onChange={(file) => handleImageChange(image.id, file)}
                />
              ))}
            </div>
            <div className="mt-6 p-3 border border-dashed rounded-md bg-white text-black">
              <p className="text-sm text-center text-gray-500 mb-2">
                Drag & Drop Images
              </p>
              <p className="text-xs text-center text-gray-400">
                Drag an image directly onto any image in the template to replace
                it
              </p>
            </div>
          </TabsContent>
          <TabsContent value="text" className="space-y-4 mt-4">
            <h3 className="font-medium">Edit Text</h3>
            <div className="space-y-3">
              {template.texts.map((text) => (
                <TextEditor
                  key={text.id}
                  text={text}
                  isActive={activeElement === text.id}
                  onChange={(value) => handleTextChange(text.id, value)}
                  onStyleChange={(property, value) =>
                    handleTextStyleChange(text.id, property, value)
                  }
                  onSelect={() => setActiveElement(text.id)}
                />
              ))}
            </div>
            <div className="mt-2 p-3 border border-dashed rounded-md bg-white text-black">
              <p className="text-xs text-center text-gray-400">
                Double-click any text on the canvas to edit it directly
              </p>
            </div>
          </TabsContent>
          <TabsContent value="layout" className="space-y-4 mt-4">
            <h3 className="font-medium">Template Layout</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Current Size:</span>
                <span className="text-sm font-medium">
                  {selectedSize.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Dimensions:</span>
                <span className="text-sm font-medium">
                  {selectedSize.width}×{selectedSize.height}px
                </span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                This template has a fixed layout. You can replace images and
                edit text, but component positions are locked.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <div
        ref={canvasContainerRef}
        className="flex-1 overflow-auto bg-gray-100 p-8 flex items-center justify-center"
      >
        <div className="relative">
          <EditorCanvas
            ref={canvasRef}
            template={template}
            activeElement={activeElement}
            setActiveElement={setActiveElement}
            setTemplate={setTemplate}
            scale={scale}
          />
          <div className="absolute -bottom-8 left-0 right-0 text-center text-xs text-gray-500">
            <Printer className="inline-block h-3 w-3 mr-1" />
            {selectedSize.label} ({Math.round(template.width * scale)}×
            {Math.round(template.height * scale)}px)
          </div>
        </div>
      </div>
    </div>
  );
}
