"use client";
import { getTemplateById } from "@/features/editor/services";
import { getTemplateForSize, printSizes } from "@/shared/lib/template";
import { Printer } from "lucide-react";
import { createContext, useContext, useRef, useState } from "react";
import EditorCanvas from "../components/editor-canvas";
import EditorSidebar from "../components/sidebar/sidebar-editor";
import { useCanvasScale } from "../hooks/use-canvas-scale";
import { useExportImage } from "../hooks/use-export-image";
import { useTemplateEditor } from "../hooks/use-template-editor";

interface Ctx extends ReturnType<typeof useTemplateEditor> {
	selectedSize: (typeof printSizes)[number];
}
const TemplateCtx = createContext<Ctx | null>(null);
export const useTemplateContext = () => {
	const ctx = useContext(TemplateCtx);
	if (!ctx) throw new Error("useTemplateContext outside provider");
	return ctx;
};

export default function TemplateEditor({ templateId }: { templateId: string }) {
	// const isMobile = useIsMobile();
	// const router = useRouter();

	const original = getTemplateById(templateId);
	const [selectedSize, setSelectedSize] = useState(printSizes[1]);
	const editor = useTemplateEditor(getTemplateForSize(original, selectedSize));

	const canvasContainerRef = useRef<HTMLDivElement>(null);
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const canvasRef = useRef<HTMLDivElement>(null!);
	const scale = useCanvasScale(
		canvasContainerRef as React.RefObject<HTMLDivElement>,
		editor.template.width,
	);

	const { exportAsImage } = useExportImage(canvasRef);

	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<TemplateCtx.Provider value={{ ...editor, selectedSize }}>
			<div className="flex h-screen flex-col">
				{/* <div className="border-b bg-white">
					<div className="container py-2 flex items-center gap-4">
						<Label className="text-sm whitespace-nowrap">Print Size:</Label>
						<Select
							value={selectedSize.name}
							onValueChange={(v) => {
								// biome-ignore lint/style/noNonNullAssertion: <explanation>
								const size = printSizes.find((s) => s.name === v)!;
								setSelectedSize(size);
								editor.changePrintSize(v);
							}}
						>
							<SelectTrigger className="w-28">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{printSizes.map((s) => (
									<SelectItem key={s.name} value={s.name}>
										{s.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Button
							variant="outline"
							size="sm"
							onClick={exportAsImage}
							className="ml-auto"
						>
							Export PNG
						</Button>
					</div>
				</div> */}

				{/* Body */}
				<div className="flex flex-1 overflow-hidden relative">
					<EditorSidebar
						open={sidebarOpen}
						onClose={() => setSidebarOpen(false)}
					/>

					{/* Canvas */}
					<div
						ref={canvasContainerRef}
						className="flex-1 overflow-auto bg-gray-100 p-8 flex items-center justify-center"
					>
						<div className="relative">
							<EditorCanvas
								ref={canvasRef}
								template={editor.template}
								setTemplate={editor.setTemplate}
								activeElement={editor.activeElement}
								setActiveElement={editor.setActiveElement}
								scale={scale}
								allowDelete={false}
							/>
							<div className="absolute -bottom-8 w-full text-center text-xs text-gray-500">
								<Printer className="inline h-3 w-3 mr-1" />
								{selectedSize.label} (
								{Math.round(editor.template.width * scale)}×
								{Math.round(editor.template.height * scale)}px)
							</div>
						</div>
					</div>
				</div>
			</div>
		</TemplateCtx.Provider>
	);
}
