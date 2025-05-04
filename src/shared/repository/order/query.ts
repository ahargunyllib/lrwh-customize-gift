"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDialogStore } from "../../hooks/use-dialog";
import { createOrder, deleteOrder, getOrders, updateOrder } from "./action";
import type {
	CreateOrderRequest,
	GetOrdersQuery,
	UpdateOrderParams,
	UpdateOrderRequest,
} from "./dto";

export const useGetOrdersQuery = (query: GetOrdersQuery) => {
	return useQuery({
		queryKey: ["orders", query],
		queryFn: () => getOrders(query),
	});
};

export const useCreateOrderMutation = () => {
	const queryClient = useQueryClient();
	const { closeDialog } = useDialogStore();

	return useMutation({
		mutationKey: ["orders"],
		mutationFn: (data: CreateOrderRequest) => createOrder(data),
		onSuccess: (res) => {
			if (!res.success) {
				toast.error(res.message);
				return;
			}

			toast.success(res.message);

			closeDialog();
			queryClient.invalidateQueries({
				queryKey: ["orders"],
			});
		},
	});
};

export const useUpdateOrderMutation = (id: UpdateOrderParams) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["orders"],
		mutationFn: (data: UpdateOrderRequest) => updateOrder(id, data),
		onSuccess: (res) => {
			if (!res.success) {
				toast.error(res.message);
				return;
			}

			toast.success(res.message);
			queryClient.invalidateQueries({
				queryKey: ["orders"],
			});
		},
	});
};

export const useDeleteOrderMutation = (id: UpdateOrderParams) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["orders"],
		mutationFn: () => deleteOrder(id),
		onSuccess: (res) => {
			if (!res.success) {
				toast.error(res.message);
				return;
			}

			toast.success(res.message);
			queryClient.invalidateQueries({
				queryKey: ["orders"],
			});
		},
	});
};
