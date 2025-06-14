"use client";

import { useSubmitOrderMutation } from "@/shared/repository/order/query";
import { toBlob } from "html-to-image";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

export function useExportImage(ref: React.RefObject<HTMLElement>) {
	const { mutate: submitOrder, isPending } = useSubmitOrderMutation();

	const orderIdJson = sessionStorage.getItem("orderId");

	const router = useRouter();

	const exportAsImage = useCallback(async () => {
		if (!ref.current) return;
		const blob = await toBlob(ref.current);
		if (!blob) {
			toast.error("Failed to convert element to image.");
			return;
		}

		if (!orderIdJson) {
			toast.error("Order ID not found. Please verify your order first.");
			return;
		}

		const orderId = JSON.parse(orderIdJson);

		submitOrder(
			{
				file: blob,
				orderId,
			},
			{
				onSuccess: (res) => {
					if (!res.success) {
						toast.error(res.message);
						return;
					}

					toast.success("Order submitted successfully!");

					sessionStorage.removeItem("orderId");

					router.replace("/");
				},
			},
		);
	}, [ref, submitOrder, orderIdJson, router]);

	return { exportAsImage, isLoading: isPending };
}
