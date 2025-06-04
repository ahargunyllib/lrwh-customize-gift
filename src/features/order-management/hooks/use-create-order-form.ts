"use client";

import {
	type CreateOrderRequest,
	createOrderSchema,
} from "@/shared/repository/order/dto";
import { useCreateOrderMutation } from "@/shared/repository/order/query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

export const useCreateOrderForm = () => {
	const { mutate: createOrder, isPending } = useCreateOrderMutation();

	const form = useForm<CreateOrderRequest>({
		resolver: zodResolver(createOrderSchema),
		defaultValues: {
			orderNumber: "",
			username: "",
		},
	});

	const onSubmitHandler = form.handleSubmit((data) => {
		createOrder(data);
		form.reset();
	});

	return {
		...form,
		isLoading: isPending,
		onSubmitHandler,
	};
};
