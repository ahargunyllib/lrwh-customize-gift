import { Separator } from "@/shared/components/ui/separator";
import { ImageUpscale, Pen, SquareRoundCorner } from "lucide-react";
import { useRef, useState } from "react";
import { useTemplateContext } from "../../containers/template-editor";
import SidebarEditor from "../sidebar/sidebar-editor";

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
			<div className="flex gap-4">
				<input
					type="file"
					accept="image/*"
					ref={inputRef}
					className="hidden"
					onChange={onFileChange}
				/>
				{/* biome-ignore lint/a11y/useButtonType: <explanation> */}
				<button
					onClick={toggleSidebar}
					className="flex items-center flex-col gap-2"
				>
					<Pen className="h-6 w-6" />
				</button>
				{activeElement?.type === "image" && (
					<>
						<Separator orientation="vertical" />
						{/* biome-ignore lint/a11y/useButtonType: <explanation> */}
						<button
							onClick={() => inputRef.current?.click()}
							className="flex items-center flex-col gap-2"
						>
							<ImageUpscale className="h-6 w-6" />
						</button>
					</>
				)}
			</div>
		</div>
	);
}
