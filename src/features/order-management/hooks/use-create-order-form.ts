"use client";

import { useDialogStore } from "@/shared/hooks/use-dialog";
import {
	type CreateOrderRequest,
	createOrderSchema,
} from "@/shared/repository/order/dto";
import { useCreateOrderMutation } from "@/shared/repository/order/query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export const useCreateOrderForm = () => {
	const { mutate: createOrder, isPending } = useCreateOrderMutation();
	const { closeDialog } = useDialogStore();

	const form = useForm<CreateOrderRequest>({
		resolver: zodResolver(createOrderSchema),
		defaultValues: {
			orderNumber: "",
			username: "",
			productVariantIds: [],
		},
	});

	const onSubmitHandler = form.handleSubmit((data) => {
		createOrder(data, {
			onSuccess: (res) => {
				if (!res.success) {
					toast.error(res.message || "Failed to create order");
					return;
				}

				form.reset();
				closeDialog();
				toast.success(res.message || "Order created successfully");
			},
		});
	});

	return {
		...form,
		isLoading: isPending,
		onSubmitHandler,
	};
};
