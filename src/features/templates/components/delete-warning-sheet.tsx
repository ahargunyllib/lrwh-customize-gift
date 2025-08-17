import { Button } from "@/shared/components/ui/button";
import { useSheetStore } from "@/shared/hooks/use-sheet";
import Image from "next/image";
import {
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "../../../shared/components/ui/sheet";

type Props = {
	onDelete: () => void;
};

export default function DeleteWarningSheet({ onDelete }: Props) {
	const { closeSheet } = useSheetStore();
	return (
		<SheetContent side="bottom">
			<div className="relative size-48 w-full">
				<Image
					src="/svgs/warning-1.svg"
					alt="Warning"
					fill
					objectFit="contain"
				/>
			</div>
			<SheetHeader className="gap-4 sm:text-center">
				<SheetTitle className="text-center text-[#1D2939] font-bold">
					Konfirmasi hapus template
				</SheetTitle>
				<SheetDescription className="text-center text-[#737373] text-sm">
					Apakah kamu yakin ingin menghapus template yang sudah kamu pilih dan
					edit? Kalau dihapus, perlu mulai dari awal lagi
				</SheetDescription>
			</SheetHeader>
			<SheetFooter className="flex flex-row gap-2">
				<Button
					variant="secondary"
					className="flex-1 px-8 py-4 h-fit bg-[#F2F4F7] hover:bg-[#dcdcdf] rounded-md shadow-none text-base font-bold text-[#344054]"
					onClick={() => closeSheet()}
				>
					Batal
				</Button>
				<Button
					onClick={() => onDelete()}
					className="flex-1 px-8 py-4 h-fit bg-[#DC2625] hover:bg-[#DC2625]/80 rounded-md shadow-none text-base font-bold text-[#ffffff]"
				>
					Hapus template
				</Button>
			</SheetFooter>
		</SheetContent>
	);
}
