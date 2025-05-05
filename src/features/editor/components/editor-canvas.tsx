"use client";

import type React from "react";
import { forwardRef, useState, useEffect, useRef } from "react";
import type {
  TemplateData,
  ImageElement,
  TextElement,
} from "@/shared/types/template";
import { Input } from "@/shared/components/ui/input";
import PlaceholderImage from "@/shared/assets/placeholder.png";
import Image from "next/image";


interface EditorCanvasProps {
  template: TemplateData;
  activeElement: string | null;
  setActiveElement: (id: string | null) => void;
  setTemplate: React.Dispatch<React.SetStateAction<TemplateData>>;
  scale: number;
}

const EditorCanvas = forwardRef<HTMLDivElement, EditorCanvasProps>(
  ({ template, activeElement, setActiveElement, setTemplate, scale }, ref) => {
    const [editingTextId, setEditingTextId] = useState<string | null>(null);

    // Listen for imageReplace events
    useEffect(() => {
      const handleImageReplace = (e: Event) => {
        const customEvent = e as CustomEvent<{ id: string; src: string }>;
        const { id, src } = customEvent.detail;
        setTemplate((prev) => ({
          ...prev,
          images: prev.images.map((img) =>
            img.id === id ? { ...img, src } : img
          ),
        }));
      };
      document.addEventListener("imageReplace", handleImageReplace);
      return () =>
        document.removeEventListener("imageReplace", handleImageReplace);
    }, [setTemplate]);

    const handleCanvasDrop = (e: React.DragEvent) => {
      e.preventDefault();
    };
    const handleCanvasDragOver = (e: React.DragEvent) => e.preventDefault();

    const handleTextDoubleClick = (id: string) => setEditingTextId(id);
    const handleTextInputChange = (
      e: React.ChangeEvent<HTMLInputElement>,
      id: string
    ) => {
      setTemplate((prev) => ({
        ...prev,
        texts: prev.texts.map((t) =>
          t.id === id ? { ...t, content: e.target.value } : t
        ),
      }));
    };
    const handleTextInputBlur = () => setEditingTextId(null);
    const handleTextInputKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") setEditingTextId(null);
    };

    return (
      <div
        ref={ref}
        className="relative bg-white shadow-lg"
        style={{
          width: template.width * scale,
          height: template.height * scale,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        onClick={() => setActiveElement(null)}
        onDrop={handleCanvasDrop}
        onDragOver={handleCanvasDragOver}
      >
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: template.backgroundColor,
            backgroundImage: template.backgroundImage
              ? `url(${template.backgroundImage})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Images */}
        {template.images.map((image) => (
          <TemplateImage
            key={image.id}
            image={image}
            isActive={activeElement === image.id}
            onClick={(e) => {
              e.stopPropagation();
              setActiveElement(image.id);
            }}
          />
        ))}

        {/* Texts */}
        {template.texts.map((text) => (
          <TemplateText
            key={text.id}
            text={text}
            isActive={activeElement === text.id}
            isEditing={editingTextId === text.id}
            onClick={(e) => {
              e.stopPropagation();
              setActiveElement(text.id);
            }}
            onDoubleClick={() => handleTextDoubleClick(text.id)}
            onInputChange={(e) => handleTextInputChange(e, text.id)}
            onInputBlur={handleTextInputBlur}
            onInputKeyDown={handleTextInputKeyDown}
          />
        ))}
      </div>
    );
  }
);

EditorCanvas.displayName = "EditorCanvas";

// TemplateImage component (unchanged)
function TemplateImage({
  image,
  isActive,
  onClick,
}: {
  image: ImageElement;
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const clearDragTimeout = () => {
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = null;
    }
  };
  useEffect(() => () => clearDragTimeout(), []);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearDragTimeout();
    if (e.dataTransfer.types.includes("Files")) setIsDragOver(true);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearDragTimeout();
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      dropZoneRef.current &&
      !dropZoneRef.current.contains(e.relatedTarget as Node)
    ) {
      dragTimeoutRef.current = setTimeout(() => setIsDragOver(false), 50);
    }
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearDragTimeout();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          document.dispatchEvent(
            new CustomEvent("imageReplace", {
              detail: { id: image.id, src: ev.target.result },
            })
          );
        }
      };
      reader.readAsDataURL(file);
      onClick(e);
    }
  };

  return (
    <div
      ref={dropZoneRef}
      className={`absolute ${isActive ? "ring-2 ring-blue-500" : ""} ${
        isDragOver ? "ring-2 ring-green-500" : ""
      }`}
      style={{
        left: image.position.x,
        top: image.position.y,
        width: image.width,
        height: image.height,
      }}
      onClick={onClick}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <img
        src={image.src || 'https://placecats.com/300/200'}
        alt="Template element"
        className="w-full h-full object-cover pointer-events-none"
        draggable={false}
      />
      {isDragOver && (
        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center pointer-events-none">
          <div className="bg-white/80 px-2 py-1 rounded text-xs font-medium">
            Drop to replace
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateText({
  text,
  isActive,
  isEditing,
  onClick,
  onDoubleClick,
  onInputChange,
  onInputBlur,
  onInputKeyDown,
}: {
  text: TextElement;
  isActive: boolean;
  isEditing: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInputBlur: () => void;
  onInputKeyDown: (e: React.KeyboardEvent) => void;
}) {
  const {
    curved,
    curveRadius = 100,
    curveDirection = "up",
    rotate = 0,
    centerX = false,
    maxWidth,
  } = text.style;

  // Konversi fontSize ke number
  const fontSizeNum =
    typeof text.style.fontSize === "string"
      ? parseFloat(text.style.fontSize)
      : text.style.fontSize;

  // Untuk curved text: hitung width dan sweepFlag
  const approxWidth = text.content.length * (fontSizeNum * 0.6);
  const sweepFlag = curveDirection === "up" ? 0 : 1;

  // Wrapper style
  const wrapperStyle: React.CSSProperties = {
    position: "absolute",
    top: text.position.y, // baseline arc akan tepat di sini
    overflow: "visible",
    transform: `rotate(${rotate}deg)`,
    transformOrigin: "center center",
    ...(centerX
      ? { left: 0, right: 0, textAlign: "center" as const }
      : { left: text.position.x }),
  };

  // Shared style untuk inner SVG/div
  const childCommonStyle: React.CSSProperties = {
    display: centerX ? "inline-block" : undefined,
    ...(maxWidth
      ? {
          maxWidth,
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word",
        }
      : {}),
  };

  return (
    <div
      className={isActive ? "ring-2 ring-blue-500 absolute" : "absolute"}
      style={wrapperStyle}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
    >
      {isEditing ? (
        <Input
          value={text.content}
          onChange={onInputChange}
          onBlur={onInputBlur}
          onKeyDown={onInputKeyDown}
          autoFocus
          className="min-w-[200px]"
          style={{
            fontFamily: text.style.fontFamily,
            fontSize: fontSizeNum,
            fontWeight: text.style.fontWeight,
            color: text.style.color,
            maxWidth: maxWidth ?? undefined,
          }}
        />
      ) : curved ? (
        <svg
          width={approxWidth + 2}
          height={curveRadius + fontSizeNum}
          viewBox={`0 -${curveRadius} ${approxWidth + 2} ${
            curveRadius + fontSizeNum
          }`}
          style={{ ...childCommonStyle, overflow: "visible" }}
        >
          <defs>
            <path
              id={`curve-path-${text.id}`}
              d={`
                M 0,0
                A ${curveRadius},${curveRadius} 0 0,${sweepFlag}
                  ${approxWidth},0
              `}
            />
          </defs>
          <text
            fontFamily={text.style.fontFamily}
            fontSize={fontSizeNum}
            fontWeight={text.style.fontWeight}
            fill={text.style.color}
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
        <div
          style={{
            ...childCommonStyle,
            fontFamily: text.style.fontFamily,
            fontSize: fontSizeNum,
            fontWeight: text.style.fontWeight,
            color: text.style.color,
            textAlign: text.style.textAlign as any,
            lineHeight: text.style.lineHeight,
          }}
        >
          {text.content}
        </div>
      )}
    </div>
  );
}

export default EditorCanvas;
