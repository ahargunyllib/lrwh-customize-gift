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
import { useTemplatesStore } from "../stores/use-templates-store";

type Props = {
	remainingCount: number;
};

export default function OrderIncompleteDialog({ remainingCount }: Props) {
	const { closeDialog } = useDialogStore();
	const { deleteOrder } = useTemplatesStore();

	const handleOke = () => {
		deleteOrder();
		closeDialog();
		window.location.href = "/templates/onboarding";
	};

	return (
		<DialogContent showCloseButton={false} className="sm:max-w-sm">
			<div className="relative size-48 w-full">
				<Image
					src="/svgs/success-1.svg"
					alt="Success"
					fill
					objectFit="contain"
				/>
			</div>
			<DialogHeader className="gap-4 sm:text-center">
				<DialogTitle className="text-center text-[#1D2939] font-bold">
					Template berhasil dikirim!
				</DialogTitle>
				<DialogDescription className="text-center text-[#737373] text-sm">
					Kamu masih perlu mengisi {remainingCount} template lagi untuk
					menyelesaikan pesanan
				</DialogDescription>
			</DialogHeader>
			<DialogFooter className="flex flex-row gap-2">
				<Button
					onClick={handleOke}
					className="flex-1 px-8 py-4 h-fit bg-[#2854AD] hover:bg-[#2854AD]/80 rounded-md shadow-none text-base font-bold text-[#ffffff]"
				>
					Oke
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}
