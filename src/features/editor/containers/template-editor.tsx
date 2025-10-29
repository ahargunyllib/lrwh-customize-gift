"use client";
import { useTemplatesStore } from "@/features/templates/stores/use-templates-store";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/shared/components/ui/sheet";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { getTemplateForSize } from "@/shared/lib/template";
import type { OrderProductVariant } from "@/shared/types";
import type { TemplateData } from "@/shared/types/template";
import html2canvas from "html2canvas-pro";
import { ImageUpscale } from "lucide-react";
import { useRouter } from "next/navigation";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import EditorCanvas from "../components/editor-canvas";
import ImageMobileEditor from "../components/mobile-editor/image-mobile-editor";
import EditorSidebar from "../components/sidebar/sidebar-editor";
import ZoomControl from "../components/zoom-control";
import { useCanvasGesture } from "../hooks/use-canvas-gesture";
import { useCanvasScale } from "../hooks/use-canvas-scale";
import { useTemplateEditor } from "../hooks/use-template-editor";

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
	orderProductVariantId,
}: {
	original: TemplateData;
	orderProductVariantId?: OrderProductVariant["id"];
}) {
	const editor = useTemplateEditor(
		getTemplateForSize(original, {
			width: original.width,
			height: original.height,
		}),
	);

	const canvasContainerRef = useRef<HTMLDivElement>(null);
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const canvasRef = useRef<HTMLDivElement>(null!);

	const { scale, zoomIn, zoomOut, resetZoom, handleZoom } = useCanvasScale(
		canvasContainerRef as React.RefObject<HTMLDivElement>,
		editor.template.width,
	);

	// Pass handleZoom to useCanvasGesture
	const { canvasOffset } = useCanvasGesture(handleZoom);

	const {
		order: { username, orderNumber },
	} = useTemplatesStore();

	return (
		<TemplateCtx.Provider
			value={{
				...editor,
				selectedSize: { width: original.width, height: original.height },
			}}
		>
			<div className="flex h-screen flex-col">
				{username && orderNumber ? (
					<header className="bg-white px-6 md:px-14 py-4 flex justify-between items-center border-b border-[#F2F4F7]">
						<div className="space-y-1">
							<h1 className="text-xl font-medium">Hai, {username}!</h1>
							<p className="text-xs text-[#98A2B3]">Order ID : {orderNumber}</p>
						</div>

						{orderProductVariantId && (
							<ConfirmationDialog
								canvasRef={canvasRef}
								orderProductVariantId={orderProductVariantId}
								resetZoom={resetZoom}
							/>
						)}
					</header>
				) : (
					<header className="bg-white px-6 md:px-14 py-4 flex justify-between items-center border-b border-[#F2F4F7]">
						<div className="space-y-1">
							<h1 className="text-xl font-medium">Template Editor Admin</h1>
						</div>

						<DownloadPreviewButton
							canvasRef={canvasRef}
							resetZoom={resetZoom}
						/>
					</header>
				)}

				{/* Body */}
				<div className="flex flex-1 overflow-hidden relative">
					<EditorSidebar />

					{/* Canvas */}
					<div
						ref={canvasContainerRef}
						className="flex-1 overflow-hidden bg-gray-100 p-8 flex items-center justify-center relative"
						style={{
							touchAction: "pan-x pan-y", // Allow panning but prevent zoom
							userSelect: "none",
							WebkitUserSelect: "none",
						}}
					>
						<div
							className="relative"
							style={{
								transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${scale})`,
								transformOrigin: "center center",
								transition: "transform 0.1s ease-out",
							}}
						>
							<EditorCanvas
								ref={canvasRef}
								template={editor.template}
								setTemplate={editor.setTemplate}
								activeElement={editor.activeElement}
								setActiveElement={editor.setActiveElement}
								scale={1} // Always pass 1, scale is handled by CSS transform
								allowDelete={false}
								getLayerIndex={editor.getLayerIndex}
							/>
						</div>

						<ImageMobileEditor />

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

function DownloadPreviewButton({
	canvasRef,
	resetZoom,
}: {
	canvasRef: React.RefObject<HTMLDivElement>;
	resetZoom: () => void;
}) {
	const { setActiveElement } = useTemplateContext();

	return (
		<Button
			onClick={async () => {
				flushSync(() => {
					resetZoom();
					setActiveElement(null);
				});

				await new Promise<void>((r) => requestAnimationFrame(() => r()));

				// Download preview image
				if (!canvasRef.current) return;
				const canvas = await html2canvas(canvasRef.current, {
					backgroundColor: null,
				});
				const dataURL = canvas.toDataURL("image/png");

				const link = document.createElement("a");
				link.href = dataURL;
				link.download = "template-preview.png";
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			}}
		>
			Download Preview
		</Button>
	);
}

function ConfirmationDialog({
	canvasRef,
	orderProductVariantId,
	resetZoom,
}: {
	canvasRef: React.RefObject<HTMLDivElement>;
	orderProductVariantId: string;
	resetZoom: () => void;
}) {
	const [isOpen, setIsOpen] = useState(false);

	const { saveTemplate } = useTemplatesStore();
	const router = useRouter();
	const isMobile = useIsMobile();

	const {
		order: { productVariants },
	} = useTemplatesStore();
	const { setActiveElement } = useTemplateContext();

	const hasMultipleProducts = useMemo(() => {
		return (
			productVariants.length > 1 ||
			(productVariants.length === 1 && productVariants[0].templates.length > 1)
		);
	}, [productVariants]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	const onSaveHandler = useCallback(async () => {
		if (!canvasRef.current) return;
		const canvas = await html2canvas(canvasRef.current, {
			backgroundColor: null,
		});
		const dataURL = canvas.toDataURL("image/png");

		saveTemplate(orderProductVariantId, dataURL);
		toast.success("Template berhasil disimpan!");

		setIsOpen(false);
		router.back();
	}, [canvasRef, saveTemplate, orderProductVariantId]);

	const nextPaint = () =>
		new Promise<void>((r) => requestAnimationFrame(() => r()));

	const onOpenChange = async (open: boolean) => {
		flushSync(() => {
			resetZoom();
			setActiveElement(null);
		});

		if (!open) {
			const previewImage = document.getElementById(
				"preview",
			) as HTMLImageElement | null;
			if (previewImage) previewImage.src = "";
			setIsOpen(false);
			return;
		}

		flushSync(() => {
			setIsOpen(true);
		});
		await nextPaint();

		if (canvasRef.current) {
			const canvas = await html2canvas(canvasRef.current, {
				backgroundColor: null,
			});
			const previewImage = document.getElementById(
				"preview",
			) as HTMLImageElement | null;
			if (previewImage) previewImage.src = canvas.toDataURL("image/png");
		}
	};

	if (isMobile) {
		return (
			<Sheet open={isOpen} onOpenChange={onOpenChange}>
				<SheetTrigger asChild>
					<Button variant="outline">Simpan</Button>
				</SheetTrigger>
				<SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
					<SheetHeader className="gap-4 sm:text-center">
						<SheetTitle className="text-center text-[#1D2939] font-bold">
							Ini Preview Template kamu
						</SheetTitle>
						<SheetDescription className="text-center text-[#737373] text-sm">
							Yuk dicek dulu, kalau masih ada yang mau diedit, tinggal klik
							tombol di bawah. Kalau udah oke, bisa lanjut ke produk berikutnya
						</SheetDescription>
					</SheetHeader>
					<div className="flex flex-col items-center justify-center py-4">
						<img
							id="preview"
							alt="Preview"
							className="border max-w-full max-h-[50vh] object-contain"
						/>
					</div>
					<SheetFooter className="flex flex-row gap-2">
						<SheetClose asChild>
							<Button
								variant="secondary"
								className="flex-1 px-8 py-4 h-fit bg-[#F2F4F7] hover:bg-[#dcdcdf] rounded-md shadow-none text-base font-bold text-[#344054]"
							>
								Edit Lagi
							</Button>
						</SheetClose>
						<Button
							onClick={() => onSaveHandler()}
							className="flex-1 px-8 py-4 h-fit bg-[#2854AD] hover:bg-[#2854AD]/80 rounded-md shadow-none text-base font-bold text-[#ffffff]"
						>
							Simpan {hasMultipleProducts && "& lanjutkan"}
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<Button variant="outline">Simpan</Button>
			</DialogTrigger>
			<DialogContent
				showCloseButton={false}
				className="max-w-[90vw] md:max-w-2xl max-h-[90vh] overflow-y-auto"
			>
				<DialogHeader className="gap-4 sm:text-center">
					<DialogTitle className="text-center text-[#1D2939] font-bold">
						Ini Preview Template kamu
					</DialogTitle>
					<DialogDescription className="text-center text-[#737373] text-sm">
						Yuk dicek dulu, kalau masih ada yang mau diedit, tinggal klik tombol
						di bawah. Kalau udah oke, bisa lanjut ke produk berikutnya
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col items-center justify-center py-4">
					<img
						id="preview"
						alt="Preview"
						className="border max-w-full max-h-[60vh] object-contain"
					/>
				</div>
				<DialogFooter className="flex flex-row gap-2">
					<DialogClose asChild>
						<Button
							variant="secondary"
							className="flex-1 px-8 py-4 h-fit bg-[#F2F4F7] hover:bg-[#dcdcdf] rounded-md shadow-none text-base font-bold text-[#344054]"
						>
							Edit Lagi
						</Button>
					</DialogClose>
					<Button
						onClick={() => onSaveHandler()}
						className="flex-1 px-8 py-4 h-fit bg-[#2854AD] hover:bg-[#2854AD]/80 rounded-md shadow-none text-base font-bold text-[#ffffff]"
					>
						Simpan {hasMultipleProducts && "& lanjutkan"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
