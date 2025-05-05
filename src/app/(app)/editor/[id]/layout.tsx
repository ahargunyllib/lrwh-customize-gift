import type { ReactNode } from "react";
import { Button } from "@/shared/components/ui/button";
import { Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";
import { printSizes } from "@/shared/lib/template";

interface EditorLayoutProps {
  children: ReactNode;
}

export default function EditorLayout({ children }: EditorLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            <Link
              href="/templates"
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold">Template Editor</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="print-size" className="text-sm whitespace-nowrap">
                Print Size:
              </Label>
              <Select defaultValue="10x15">
                <SelectTrigger id="print-size" className="w-28">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  {printSizes.map((size) => (
                    <SelectItem key={size.name} value={size.name}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" id="export-button">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
