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

type Props = {
	onDelete: () => void;
};

export default function DeleteWarningDialog({ onDelete }: Props) {
	const { closeDialog } = useDialogStore();

	return (
		<DialogContent showCloseButton={false} className="sm:max-w-sm">
			<div className="relative size-48 w-full">
				<Image
					src="/svgs/warning-1.svg"
					alt="Warning"
					fill
					objectFit="contain"
				/>
			</div>
			<DialogHeader className="gap-4 sm:text-center">
				<DialogTitle className="text-center text-[#1D2939] font-bold">
					Konfirmasi hapus template
				</DialogTitle>
				<DialogDescription className="text-center text-[#737373] text-sm">
					Apakah kamu yakin ingin menghapus template yang sudah kamu pilih dan
					edit? Kalau dihapus, perlu memulai dari awal lagi
				</DialogDescription>
			</DialogHeader>
			<DialogFooter className="flex flex-row gap-2">
				<Button
					variant="secondary"
					className="flex-1 px-8 py-4 h-fit bg-[#F2F4F7] hover:bg-[#dcdcdf] rounded-md shadow-none text-base font-bold text-[#344054]"
					onClick={() => closeDialog()}
				>
					Batal
				</Button>
				<Button
					onClick={() => onDelete()}
					className="flex-1 px-8 py-4 h-fit bg-[#DC2625] hover:bg-[#DC2625]/80 rounded-md shadow-none text-base font-bold text-[#ffffff]"
				>
					Hapus template
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}
