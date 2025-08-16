"use client";

import {
	type VerifyOrderByUsernameAndOrderNumberRequest,
	VerifyOrderByUsernameAndOrderNumberSchema,
} from "@/shared/repository/order/dto";
import { useVerifyOrderByUsernameAndOrderNumberMutation } from "@/shared/repository/order/query";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTemplatesStore } from "../stores/use-templates-store";

export const useOnboardingForm = () => {
	const { mutate: verifyOrderByUsernameAndOrderNumber, isPending } =
		useVerifyOrderByUsernameAndOrderNumberMutation();

	const form = useForm<VerifyOrderByUsernameAndOrderNumberRequest>({
		resolver: zodResolver(VerifyOrderByUsernameAndOrderNumberSchema),
		defaultValues: {
			username: "",
			orderNumber: "",
		},
	});

	const { updateOrder } = useTemplatesStore();

	const router = useRouter();

	const onSubmitHandler = form.handleSubmit((data) => {
		verifyOrderByUsernameAndOrderNumber(data, {
			onSuccess: (res) => {
				if (!res.success) {
					toast.error(res.message);
					return;
				}

				toast.success("Order verified successfully!");
				form.reset();

				const { order } = res.data;
				updateOrder(order);

				router.push("/templates");
			},
		});
	});

	return {
		...form,
		onSubmitHandler,
		isLoading: isPending,
	};
};
