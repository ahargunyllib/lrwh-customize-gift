"use client";

import {
	type VerifyOrderByUsernameAndOrderNumberRequest,
	VerifyOrderByUsernameAndOrderNumberSchema,
} from "@/shared/repository/order/dto";
import { useVerifyOrderByUsernameAndOrderNumberMutation } from "@/shared/repository/order/query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
	closeDialog: () => void;
};

export const useOnboardingForm = ({ closeDialog }: Props) => {
	const { mutate: verifyOrderByUsernameAndOrderNumber, isPending } =
		useVerifyOrderByUsernameAndOrderNumberMutation();

	const form = useForm<VerifyOrderByUsernameAndOrderNumberRequest>({
		resolver: zodResolver(VerifyOrderByUsernameAndOrderNumberSchema),
		defaultValues: {
			username: "",
			orderNumber: "",
		},
	});

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

				sessionStorage.setItem("orderId", JSON.stringify(order.id));

				closeDialog();
			},
		});
	});

	return {
		...form,
		onSubmitHandler,
		isLoading: isPending,
	};
};
