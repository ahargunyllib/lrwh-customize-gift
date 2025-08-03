import { ImageUpscale } from "lucide-react";
import { useRef } from "react";
import { useTemplateContext } from "../../containers/template-editor";

export default function ImageMobileEditor() {
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
			handleReplace(activeElement, file);
		}
	};

	if (!activeElement) return null;

	return (
		<div
			className="fixed left-1/2 bottom-4 z-10 flex flex-row gap-2 bg-white rounded-lg shadow-lg p-2"
			style={{ transform: "translateX(-50%)" }}
		>
			<input
				type="file"
				accept="image/*"
				ref={inputRef}
				className="hidden"
				onChange={onFileChange}
			/>
			{/* biome-ignore lint/a11y/useButtonType: <explanation> */}
			<button onClick={() => inputRef.current?.click()}>
				<ImageUpscale className="h-5 w-5" />
				<span className="sr-only">Ganti Gambar</span>
			</button>
		</div>
	);
}
