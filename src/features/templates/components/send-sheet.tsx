"use client";

import { Button } from "@/shared/components/ui/button";
import {
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/shared/components/ui/sheet";
import { useSheetStore } from "@/shared/hooks/use-sheet";
import { useSubmitOrderMutation } from "@/shared/repository/order/query";
import { LoaderIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTemplatesStore } from "../stores/use-templates-store";
import OrderCompletedSheet from "./order-completed-sheet";
import OrderIncompleteSheet from "./order-incomplete-sheet";

export default function SendSheet() {
	const { closeSheet, openSheet } = useSheetStore();
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
						closeSheet();
						toast.error("Gagal mengirim template, silakan coba lagi.", {
							description: res.message || "Terjadi kesalahan",
						});
						return;
					}

					// Check if order is completed
					if (res.data?.status === "completed") {
						// Show completed sheet
						openSheet({
							children: <OrderCompletedSheet />,
						});
						return;
					}

					// Show incomplete sheet
					openSheet({
						children: (
							<OrderIncompleteSheet
								remainingCount={res.data?.remainingCount || 0}
							/>
						),
					});
				},
			},
		);
	};

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
					Sudah Yakin?
				</SheetTitle>
				<SheetDescription className="text-center text-[#737373] text-sm">
					Yakin sudah cocok? Hasil cetak sesuai dengan desain yang sudah kamu
					buat ya. Kalau sudah oke, klik "kirim".
				</SheetDescription>
			</SheetHeader>
			<SheetFooter className="flex flex-row gap-2">
				<Button
					variant="secondary"
					className="flex-1 px-8 py-4 h-fit bg-[#F2F4F7] hover:bg-[#dcdcdf] rounded-md shadow-none text-base font-bold text-[#344054]"
					onClick={() => closeSheet()}
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
			</SheetFooter>
		</SheetContent>
	);
}
