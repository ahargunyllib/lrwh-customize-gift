import { Button } from "@/shared/components/ui/button";
import {
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { useDialogStore } from "@/shared/hooks/use-dialog";
import Image from "next/image";

export default function FirstVisitDialog() {
	const { closeDialog } = useDialogStore();

	const handleContinue = () => {
		closeDialog();
	};

	return (
		<DialogContent showCloseButton={false} className="sm:max-w-md">
			<DialogHeader className="gap-4 sm:text-center">
				<DialogTitle className="text-center text-[#1D2939] font-bold text-2xl">
					Selamat Datang!
				</DialogTitle>
				<DialogDescription className="text-center text-[#737373] text-sm leading-relaxed">
					Kamu bisa pilih desain sesuai keinginanmu, bisa tambah teks & foto.
				</DialogDescription>
			</DialogHeader>

			<div className="relative aspect-[3/4] w-full">
				<Image
					src="/imgs/first-visit.png"
					alt="Welcome Image"
					fill
					className="object-contain"
				/>
			</div>

			<DialogFooter className="flex flex-row gap-2">
				<Button
					onClick={handleContinue}
					className="flex-1 px-8 py-4 h-fit bg-[#2854AD] hover:bg-[#2854AD]/80 rounded-md shadow-none text-base font-bold text-[#ffffff]"
				>
					Mulai Sekarang
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}
