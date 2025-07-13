"use client";

import { tryCatch } from "@/shared/lib/try-catch";
import { useSubmitOrderMutation } from "@/shared/repository/order/query";
import type { Order } from "@/shared/types";
import html2canvas from "html2canvas-pro";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

export function useExportImage(ref: React.RefObject<HTMLElement>) {
	const { mutate: submitOrder, isPending } = useSubmitOrderMutation();

	const orderIdJson = sessionStorage.getItem("orderId");

	const router = useRouter();

	const exportAsImage = useCallback(async () => {
		if (!ref.current) return;
		const canvas = await html2canvas(ref.current, { backgroundColor: null });
		const blob = await new Promise<Blob | null>((res) =>
			canvas.toBlob(res, "image/png"),
		);
		if (!blob) {
			toast.error("Failed to convert element to image.");
			return;
		}

		if (!orderIdJson) {
			toast.error("Order ID not found. Please verify your order first.");
			return;
		}

		const { data: orderId, error } = await tryCatch(JSON.parse(orderIdJson));
		if (error) {
			toast.error("Invalid order ID format.");
		}

		if (!orderId || typeof orderId !== "string") {
			toast.error("Invalid order ID. Please verify your order first.");
			return;
		}

		submitOrder(
			{
				file: blob,
				orderId: orderId as Order["id"],
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
