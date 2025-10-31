"use client";

import {
	type VerifyOrderByUsernameAndOrderNumberRequest,
	VerifyOrderByUsernameAndOrderNumberSchema,
} from "@/shared/repository/order/dto";
import { useVerifyOrderByUsernameAndOrderNumberMutation } from "@/shared/repository/order/query";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTemplatesStore } from "../stores/use-templates-store";

export const useOnboardingForm = () => {
	const { mutate: verifyOrderByUsernameAndOrderNumber, isPending } =
		useVerifyOrderByUsernameAndOrderNumberMutation();
	const searchParams = useSearchParams();

	const productVariantId = searchParams.get("productVariantId");

	const form = useForm<VerifyOrderByUsernameAndOrderNumberRequest>({
		resolver: zodResolver(VerifyOrderByUsernameAndOrderNumberSchema),
		defaultValues: {
			username: searchParams.get("username") || "",
			orderNumber: searchParams.get("orderNumber") || "",
		},
	});

	const { updateOrder } = useTemplatesStore();

	const router = useRouter();

	const onSubmitHandler = form.handleSubmit((data) => {
		verifyOrderByUsernameAndOrderNumber(data, {
			onSuccess: (res) => {
				if (!res.success) {
					toast.error("Gagal memverifikasi order, silahkan coba lagi.", {
						description: res.message || "Terjadi kesalahan",
					});
					return;
				}

				toast.success("Order berhasil diverifikasi!");
				form.reset();

				const { order } = res.data;
				updateOrder(order);

				router.push(
					`/templates?productVariantId=${productVariantId || order.productVariants[0]?.id}`,
				); // Redirect to the first product variant if none is specified
			},
		});
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies:
	useEffect(() => {
		if (searchParams.get("username") && searchParams.get("orderNumber")) {
			onSubmitHandler();
		}
	}, [searchParams]);

	return {
		...form,
		onSubmitHandler,
		isLoading: isPending,
	};
};
