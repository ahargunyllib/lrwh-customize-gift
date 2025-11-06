"use client";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuShortcut,
	ContextMenuTrigger,
} from "@/shared/components/ui/context-menu";
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
import RulerSystem from "../components/ruler/ruler-system";
import Sidebar from "../components/sidebar/sidebar-creator";
import ZoomControl from "../components/zoom-control";
import { useCanvasGesture } from "../hooks/use-canvas-gesture";
import { useCanvasScale } from "../hooks/use-canvas-scale";
import { useRulerGuides } from "../hooks/use-ruler-guides";
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
	const {
		template,
		setTemplate,
		activeElement,
		setActiveElement,
		getLayerIndex,
	} = useTemplateContext();

	const { scale, zoomIn, zoomOut, resetZoom } = useCanvasScale(
		ref as React.RefObject<HTMLDivElement>,
		template.width,
	);

	const { canvasOffset, bindGesture } = useCanvasGesture();

	const getMousePosition = () => {
		const canvas = document.querySelector('[data-canvas="true"]');
		if (canvas) {
			const canvasRect = canvas.getBoundingClientRect();
			return {
				x: canvasRect.left + canvasRect.width / 2,
				y: canvasRect.top + canvasRect.height / 2,
			};
		}
		return { x: 0, y: 0 };
	};

	// Ruler guides management
	const { guides, createGuide, updateGuidePosition, removeGuide } =
		useRulerGuides(scale, template.width, template.height);

	const handleAddHorizontalGuide = () => {
		const mousePosition = getMousePosition();
		createGuide({
			orientation: "horizontal",
			position: mousePosition.y,
		});
	};

	const handleAddVerticalGuide = () => {
		const mousePosition = getMousePosition();
		createGuide({
			orientation: "vertical",
			position: mousePosition.x,
		});
	};

	return (
		<ContextMenu>
			<ContextMenuTrigger className="bg-red-400 w-full h-full">
				<div
					ref={ref}
					className="relative flex-1 bg-gray-100 flex items-center justify-center overflow-clip h-full"
					{...bindGesture}
				>
					{/* Rulers fixed to viewport edges */}
					<RulerSystem
						scale={scale}
						canvasWidth={template.width}
						canvasHeight={template.height}
						canvasOffset={canvasOffset}
						containerRef={ref as React.RefObject<HTMLDivElement>}
						onCreateGuide={createGuide}
					/>
					{/* Canvas with guides (can pan) */}
					<div
						className="relative"
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
							isCustomizing={true}
							getLayerIndex={getLayerIndex}
							rulerGuides={guides}
							onGuidePositionChange={updateGuidePosition}
							onGuideRemove={removeGuide}
						/>
					</div>
					{/* Zoom control in out */}
					<ZoomControl
						zoomIn={zoomIn}
						zoomOut={zoomOut}
						resetZoom={resetZoom}
					/>
				</div>
			</ContextMenuTrigger>
			<ContextMenuContent className="w-60">
				<ContextMenuItem inset onClick={handleAddHorizontalGuide}>
					Add Horizontal Guide
					<ContextMenuShortcut>⌘H</ContextMenuShortcut>
				</ContextMenuItem>
				<ContextMenuItem inset onClick={handleAddVerticalGuide}>
					Add Vertical Guide
					<ContextMenuShortcut>⌘V</ContextMenuShortcut>
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
});
CanvasArea.displayName = "CanvasArea";
