"use client";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import {
	type ReactNode,
	createContext,
	forwardRef,
	useContext,
	useRef,
	useState,
} from "react";
import EditorCanvas from "../components/editor-canvas";
import HeaderBar from "../components/header/header-creator";
import Sidebar from "../components/sidebar/sidebar-creator";
import ZoomControl from "../components/zoom-control";
import { useCanvasGesture } from "../hooks/use-canvas-gesture";
import { useCanvasScale } from "../hooks/use-canvas-scale";
import { useTemplateEditor } from "../hooks/use-template-editor";
import { useTemplatePersistence } from "../hooks/use-template-persistence";

const TemplateCtx = createContext<ReturnType<typeof useTemplateEditor> | null>(
	null,
);
export const useTemplateContext = () => {
	const ctx = useContext(TemplateCtx);
	if (!ctx) throw new Error("useTemplateContext outside provider");
	return ctx;
};

function Provider({
	children,
	loadId,
}: {
	children: ReactNode;
	loadId?: string;
}) {
	const editor = useTemplateEditor();
	const { setTemplate, template } = editor;

	const { save } = useTemplatePersistence(loadId, setTemplate);
	return (
		<TemplateCtx.Provider value={editor}>
			{/* Header */}
			<HeaderBar
				title="Create New Template"
				onMenuClick={() => editor.setActiveElement(null)}
				onSave={() => {
					save(template);
				}}
			/>
			{children}
		</TemplateCtx.Provider>
	);
}

export default function TemplateCreator({
	templateId,
}: { templateId?: string }) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const canvasContainerRef = useRef<HTMLDivElement>(null);

	/* editor from context */
	return (
		<Provider loadId={templateId}>
			<div className="flex flex-1 overflow-hidden relative h-[calc(100vh-60px)]">
				{/* Sidebar */}
				<Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

				{/* Canvas */}
				<CanvasArea ref={canvasContainerRef} />
			</div>
		</Provider>
	);
}

const CanvasArea = forwardRef<HTMLDivElement>((_, ref) => {
	const { template, setTemplate, activeElement, setActiveElement } =
		useTemplateContext();

	const { scale, zoomIn, zoomOut, resetZoom } = useCanvasScale(
		ref as React.RefObject<HTMLDivElement>,
		template.width,
	);

	const { canvasOffset, bindGesture } = useCanvasGesture();

	return (
		<div
			ref={ref}
			className="relative flex-1 bg-gray-100 flex items-center justify-center overflow-clip"
			{...bindGesture}
		>
			<div
				// Apply the canvas offset to the canvas container
				style={{
					transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
				}}
			>
				<EditorCanvas
					template={template}
					setTemplate={setTemplate}
					activeElement={activeElement}
					setActiveElement={setActiveElement}
					scale={scale}
					isCustomizing
				/>
			</div>

			{/* Zoom control in out */}
			<ZoomControl zoomIn={zoomIn} zoomOut={zoomOut} resetZoom={resetZoom} />
		</div>
	);
});
CanvasArea.displayName = "CanvasArea";
