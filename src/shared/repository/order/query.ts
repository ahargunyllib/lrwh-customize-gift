"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createOrder,
	deleteOrder,
	getOrders,
	submitOrder,
	updateOrder,
	verifyOrderByUsernameAndOrderNumber,
} from "./action";
import type {
	CreateOrderRequest,
	GetOrdersQuery,
	SubmitOrderRequest,
	UpdateOrderParams,
	UpdateOrderRequest,
	VerifyOrderByUsernameAndOrderNumberRequest,
} from "./dto";

export const useGetOrdersQuery = (query: GetOrdersQuery) => {
	return useQuery({
		queryKey: ["orders", query],
		queryFn: () => getOrders(query),
	});
};

export const useVerifyOrderByUsernameAndOrderNumberMutation = () => {
	return useMutation({
		mutationKey: ["verify-order"],
		mutationFn: (data: VerifyOrderByUsernameAndOrderNumberRequest) =>
			verifyOrderByUsernameAndOrderNumber(data),
	});
};

export const useCreateOrderMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["orders"],
		mutationFn: (data: CreateOrderRequest) => createOrder(data),
		onSuccess: (res) => {
			if (!res.success) {
				return;
			}

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
				return;
			}

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
				return;
			}

			queryClient.invalidateQueries({
				queryKey: ["orders"],
			});
		},
	});
};

export const useSubmitOrderMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["submit-order"],
		mutationFn: (data: SubmitOrderRequest) => submitOrder(data),
		onSuccess: (res) => {
			if (!res.success) {
				return;
			}

			queryClient.invalidateQueries({
				queryKey: ["orders"],
			});
		},
	});
};
