"use client";

import { Button } from "@/shared/components/ui/button";
import {
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { useDialogStore } from "@/shared/hooks/use-dialog";
import { useSubmitOrderMutation } from "@/shared/repository/order/query";
import { LoaderIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTemplatesStore } from "../stores/use-templates-store";
import OrderCompletedDialog from "./order-completed-dialog";
import OrderIncompleteDialog from "./order-incomplete-dialog";

export default function SendDialog() {
	const { closeDialog, openDialog } = useDialogStore();
	const { mutate: submitOrder, isPending } = useSubmitOrderMutation();
	const {
		order: { id, productVariants },
		deleteOrder,
	} = useTemplatesStore();
	const router = useRouter();

	const onSubmitHandler = () => {
		const templates = [];
		for (const productVariant of productVariants) {
			for (const template of productVariant.templates) {
				if (template.dataURL) {
					templates.push({
						orderProductVariantId: template.id,
						dataURL: template.dataURL,
					});
				}
			}
		}
		submitOrder(
			{
				orderId: id,
				templates,
			},
			{
				onSuccess: (res) => {
					if (!res.success) {
						closeDialog();
						toast.error("Gagal mengirim template, silakan coba lagi.", {
							description: res.message || "Terjadi kesalahan",
						});
						return;
					}

					// Check if order is completed
					if (res.data?.status === "completed") {
						// Show completed dialog
						openDialog({
							children: <OrderCompletedDialog />,
						});
						return;
					}

					// Show incomplete dialog
					openDialog({
						children: (
							<OrderIncompleteDialog
								remainingCount={res.data?.remainingCount || 0}
							/>
						),
					});
				},
			},
		);
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
					Konfirmasi template pemesanan
				</DialogTitle>
				<DialogDescription className="text-center text-[#737373] text-sm">
					Apakah kamu yakin templatenya sudah cocok? kalo udah oke bisa kirim ke
					kami
				</DialogDescription>
			</DialogHeader>
			<DialogFooter className="flex flex-row gap-2">
				<Button
					variant="secondary"
					className="flex-1 px-8 py-4 h-fit bg-[#F2F4F7] hover:bg-[#dcdcdf] rounded-md shadow-none text-base font-bold text-[#344054]"
					onClick={() => closeDialog()}
				>
					Kembali
				</Button>
				<Button
					onClick={() => onSubmitHandler()}
					className="flex-1 px-8 py-4 h-fit bg-[#2854AD] hover:bg-[#2854AD]/80 rounded-md shadow-none text-base font-bold text-[#ffffff]"
				>
					{isPending ? (
						<>
							<LoaderIcon className="animate-spin" />
							Mengirim...
						</>
					) : (
						<>Kirim</>
					)}
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}
