import { Button } from "@/shared/components/ui/button";
import {
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/shared/components/ui/sheet";
import { useSheetStore } from "@/shared/hooks/use-sheet";
import Image from "next/image";
import { useTemplatesStore } from "../stores/use-templates-store";

type Props = {
	remainingCount: number;
};

export default function OrderIncompleteSheet({ remainingCount }: Props) {
	const { closeSheet } = useSheetStore();
	const { deleteOrder } = useTemplatesStore();

	const handleOke = () => {
		deleteOrder();
		closeSheet();
		window.location.href = "/templates/onboarding";
	};

	return (
		<SheetContent side="bottom">
			<div className="relative size-48 w-full">
				<Image
					src="/svgs/success-1.svg"
					alt="Success"
					fill
					objectFit="contain"
				/>
			</div>
			<SheetHeader className="gap-4 sm:text-center">
				<SheetTitle className="text-center text-[#1D2939] font-bold">
					Template berhasil dikirim!
				</SheetTitle>
				<SheetDescription className="text-center text-[#737373] text-sm">
					Kamu masih perlu mengisi {remainingCount} template lagi untuk
					menyelesaikan pesanan
				</SheetDescription>
			</SheetHeader>
			<SheetFooter className="flex flex-row gap-2">
				<Button
					onClick={handleOke}
					className="flex-1 px-8 py-4 h-fit bg-[#2854AD] hover:bg-[#2854AD]/80 rounded-md shadow-none text-base font-bold text-[#ffffff]"
				>
					Oke
				</Button>
			</SheetFooter>
		</SheetContent>
	);
}
