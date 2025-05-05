"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/shared/components/ui/button"
import type { ImageElement } from "@/shared/types/template"
import { Upload } from "lucide-react"
import PlaceholderImage from "@/shared/assets/placeholder.png"


interface ImageUploaderProps {
  image: ImageElement
  onChange: (file: File) => void
}

export default function ImageUploader({ image, onChange }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("image/")) {
        onChange(file)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onChange(e.target.files[0])
    }
  }

  return (
    <div className="space-y-2">
      <div
        className={`relative border rounded-md overflow-hidden h-24 ${
          isDragging ? "border-primary border-dashed bg-primary/5" : "border-gray-200"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <img src={image.src || 'https://placecats.com/300/200'} alt="Template image" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Button variant="secondary" size="sm" onClick={() => document.getElementById(`file-${image.id}`)?.click()}>
            <Upload className="h-4 w-4 mr-1" /> Replace
          </Button>
        </div>
      </div>
      <input id={`file-${image.id}`} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  )
}
