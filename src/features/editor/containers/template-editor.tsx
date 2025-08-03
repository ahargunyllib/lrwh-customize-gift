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
import { ImageUpscale } from "lucide-react";
import html2canvas from "html2canvas-pro";
import { useRouter } from "next/navigation";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";
import EditorCanvas from "../components/editor-canvas";
import ImageMobileEditor from "../components/mobile-editor/image-mobile-editor";
import EditorSidebar from "../components/sidebar/sidebar-editor";
import ZoomControl from "../components/zoom-control";
import { useCanvasGesture } from "../hooks/use-canvas-gesture";
import { useCanvasScale } from "../hooks/use-canvas-scale";
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
	const { scale, zoomIn, zoomOut, resetZoom } = useCanvasScale(
		canvasContainerRef as React.RefObject<HTMLDivElement>,
		editor.template.width,
	);
	const { canvasOffset, bindGesture } = useCanvasGesture();

	const [sidebarOpen, setSidebarOpen] = useState(false);

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
				<header className="bg-white px-6 md:px-14 py-4 flex justify-between items-center border-b border-[#F2F4F7]">
					{username && orderNumber && (
						<div className="space-y-1">
							<h1 className="text-xl font-medium">Hai, {username}!</h1>
							<p className="text-xs text-[#98A2B3]">Order ID : {orderNumber}</p>
						</div>
					)}

					{orderProductVariantId && (
						<ConfirmationDialog
							canvasRef={canvasRef}
							orderProductVariantId={orderProductVariantId}
						/>
					)}
				</header>

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

function ConfirmationDialog({
	canvasRef,
	orderProductVariantId,
}: {
	canvasRef: React.RefObject<HTMLDivElement>;
	orderProductVariantId: string;
}) {
	const [isOpen, setIsOpen] = useState(false);

	const { saveTemplate } = useTemplatesStore();
	const router = useRouter();
	const isMobile = useIsMobile();

	const {
		order: { productVariants },
	} = useTemplatesStore();

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

	const onOpenChange = async (open: boolean) => {
		if (!open) {
			// Reset the canvas state when dialog is closed
			const previewImage = document.getElementById(
				"preview",
			) as HTMLImageElement;
			if (previewImage) {
				previewImage.src = "";
			}

			setIsOpen(false);
			return;
		}

		// Generate preview image when dialog is opened
		if (canvasRef.current) {
			html2canvas(canvasRef.current, { backgroundColor: null }).then(
				(canvas) => {
					const previewImage = document.getElementById(
						"preview",
					) as HTMLImageElement;
					previewImage.src = canvas.toDataURL("image/png");
				},
			);
		}

		setIsOpen(open);
	};

	if (isMobile) {
		return (
			<Sheet open={isOpen} onOpenChange={onOpenChange}>
				<SheetTrigger asChild>
					<Button variant="outline">Simpan</Button>
				</SheetTrigger>
				<SheetContent side="bottom">
					<SheetHeader className="gap-4 sm:text-center">
						<SheetTitle className="text-center text-[#1D2939] font-bold">
							Ini Preview Template kamu
						</SheetTitle>
						<SheetDescription className="text-center text-[#737373] text-sm">
							Yuk dicek dulu, kalau masih ada yang mau diedit, tinggal klik
							tombol di bawah. Kalau udah oke, bisa lanjut ke produk berikutnya
						</SheetDescription>
					</SheetHeader>
					<div className="flex flex-col items-center justify-center">
						<img id="preview" alt="Preview" className="border" />
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
			<DialogContent showCloseButton={false}>
				<DialogHeader className="gap-4 sm:text-center">
					<DialogTitle className="text-center text-[#1D2939] font-bold">
						Ini Preview Template kamu
					</DialogTitle>
					<DialogDescription className="text-center text-[#737373] text-sm">
						Yuk dicek dulu, kalau masih ada yang mau diedit, tinggal klik tombol
						di bawah. Kalau udah oke, bisa lanjut ke produk berikutnya
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col items-center justify-center">
					<img id="preview" alt="Preview" className="border" />
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
