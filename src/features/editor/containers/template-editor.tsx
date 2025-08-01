"use client";
import { Button } from "@/shared/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { getTemplateForSize } from "@/shared/lib/template";
import { useSessionQuery } from "@/shared/repository/session-manager/query";
import type { TemplateData } from "@/shared/types/template";
import { useRouter } from "next/navigation";
import { createContext, useContext, useRef, useState } from "react";
import EditorCanvas from "../components/editor-canvas";
import EditorSidebar from "../components/sidebar/sidebar-editor";
import ZoomControl from "../components/zoom-control";
import { useCanvasGesture } from "../hooks/use-canvas-gesture";
import { useCanvasScale } from "../hooks/use-canvas-scale";
import { useExportImage } from "../hooks/use-export-image";
import { useTemplateEditor } from "../hooks/use-template-editor";

// interface Ctx extends ReturnType<typeof useTemplateEditor> {
// 	selectedSize: (typeof printSizes)[number];
// }
type Ctx = ReturnType<typeof useTemplateEditor> & {
	selectedSize: {
		width: number;
		height: number;
	};
};
const TemplateCtx = createContext<Ctx | null>(null);
export const useTemplateContext = () => {
	const ctx = useContext(TemplateCtx);
	if (!ctx) throw new Error("useTemplateContext outside provider");
	return ctx;
};

export default function TemplateEditor({
	original,
}: { original: TemplateData }) {
	// const isMobile = useIsMobile();
	// const router = useRouter();

	const [selectedSize, setSelectedSize] = useState({
		width: original.width,
		height: original.height,
	});
	const editor = useTemplateEditor(getTemplateForSize(original, selectedSize));

	const canvasContainerRef = useRef<HTMLDivElement>(null);
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const canvasRef = useRef<HTMLDivElement>(null!);
	const { scale, zoomIn, zoomOut, resetZoom } = useCanvasScale(
		canvasContainerRef as React.RefObject<HTMLDivElement>,
		editor.template.width,
	);
	const { canvasOffset, bindGesture } = useCanvasGesture();

	const { exportAsImage, isLoading } = useExportImage(canvasRef);

	const [sidebarOpen, setSidebarOpen] = useState(false);

	// check if guest try to access editor without orderId
	const orderIdJson = sessionStorage.getItem("orderId");
	const session = useSessionQuery();
	const router = useRouter();
	const canAccess = session.data?.isLoggedIn || !!orderIdJson;
	if (!canAccess) {
		router.replace("/");
		return null;
	}

	return (
		<TemplateCtx.Provider value={{ ...editor, selectedSize }}>
			<div className="flex h-screen flex-col">
				<div className="border-b bg-white">
					<div className="px-4 md:px-8 lg:px-12 py-2 flex items-center gap-4">
						{/* <h1>Print Size:</h1>
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
						</Select> */}

						{!!orderIdJson && (
							<Button
								variant="outline"
								size="sm"
								onClick={exportAsImage}
								className="ml-auto"
								disabled={isLoading}
							>
								{isLoading ? "Loading..." : "Submit"}
							</Button>
						)}
					</div>
				</div>

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
						{...bindGesture}
					>
						<div
							className="relative"
							style={{
								transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
							}}
						>
							<EditorCanvas
								ref={canvasRef}
								template={editor.template}
								setTemplate={editor.setTemplate}
								activeElement={editor.activeElement}
								setActiveElement={editor.setActiveElement}
								scale={scale}
								allowDelete={false}
							/>
						</div>

						<ZoomControl
							zoomIn={zoomIn}
							zoomOut={zoomOut}
							resetZoom={resetZoom}
						/>
					</div>
				</div>
			</div>
		</TemplateCtx.Provider>
	);
}
