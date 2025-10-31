import { ImagesIcon, Pen } from "lucide-react";
import { useRef } from "react";
import { Button } from "../../../../shared/components/ui/button";
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
				<Tooltip>
					<TooltipTrigger>
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
						<TooltipTrigger>
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
