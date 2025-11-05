import { HelpCircle, ImagesIcon, Pen } from "lucide-react";
import { useRef } from "react";
import { Button } from "../../../../shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../../../../shared/components/ui/dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "../../../../shared/components/ui/tooltip";
import { useTemplateContext } from "../../containers/template-editor";

export default function ImageMobileEditor({
	toggleSidebar,
}: {
	toggleSidebar: () => void;
}) {
	const { updateImage, activeElement } = useTemplateContext();
	const inputRef = useRef<HTMLInputElement | null>(null);

	const handleReplace = (imgId: string, file: File) => {
		const reader = new FileReader();
		reader.onload = (ev) =>
			updateImage(imgId, { src: ev.target?.result as string });
		reader.readAsDataURL(file);
	};

	const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file && activeElement) {
			handleReplace(activeElement.id, file);
			// Reset input value to allow selecting the same file again
			e.target.value = "";
		}
	};

	return (
		<div
			className="fixed left-1/2 bottom-4 z-10 flex flex-row gap-2 bg-white rounded-lg shadow-lg p-2"
			style={{ transform: "translateX(-50%)" }}
		>
			<div className="flex gap-1">
				<input
					type="file"
					accept="image/*"
					ref={inputRef}
					className="hidden"
					onChange={onFileChange}
				/>
				<Dialog>
					<Tooltip>
						<TooltipTrigger asChild>
							<DialogTrigger asChild>
								<Button
									size="icon"
									variant="ghost"
									className="size-10"
									aria-label="Tips"
								>
									<HelpCircle className="size-6" />
								</Button>
							</DialogTrigger>
						</TooltipTrigger>
						<TooltipContent>
							<span>Tips</span>
						</TooltipContent>
					</Tooltip>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Tips Menggunakan Editor</DialogTitle>
						</DialogHeader>
						<ul className="list-disc list-inside text-sm text-gray-600">
							<li>Tekan lalu geser untuk memindahkan elemen.</li>
							<li>Tekan dua kali pada elemen untuk mengeditnya.</li>
							<li>
								Tekan ikon pensil pada pojok bawah untuk membuka sidebar editor.
							</li>
							<li>
								Gunakan kontrol zoom untuk memperbesar atau memperkecil canvas.
							</li>
						</ul>
					</DialogContent>
				</Dialog>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							onClick={toggleSidebar}
							variant="ghost"
							className="size-10"
							aria-label="Edit Konten"
						>
							<Pen className="size-6" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<span>Edit Konten</span>
					</TooltipContent>
				</Tooltip>
				{activeElement?.type === "image" && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								size="icon"
								onClick={() => inputRef.current?.click()}
								variant="ghost"
								className="size-10"
								aria-label="Ganti Gambar"
							>
								<ImagesIcon className="size-6" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<span>Ganti Gambar</span>
						</TooltipContent>
					</Tooltip>
				)}
			</div>
		</div>
	);
}
