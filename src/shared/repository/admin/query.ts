"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createAdmin,
	deleteAdmin,
	getAdmin,
	getAllAdmins,
	updateAdmin,
} from "./action";
import type {
	CreateAdminRequest,
	DeleteAdminParams,
	GetAdminParams,
	UpdateAdminParams,
	UpdateAdminRequest,
} from "./dto";

export const adminKeys = {
	all: ["admins"] as const,
	detail: (id: number) => ["admins", id] as const,
};

export const useGetAllAdminsQuery = () => {
	return useQuery({
		queryKey: adminKeys.all,
		queryFn: () => getAllAdmins(),
	});
};

export const useGetAdminQuery = (params: GetAdminParams) => {
	return useQuery({
		queryKey: adminKeys.detail(params.id),
		queryFn: () => getAdmin(params),
	});
};

export const useCreateAdminMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateAdminRequest) => createAdmin(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: adminKeys.all });
		},
	});
};

export const useUpdateAdminMutation = (params: UpdateAdminParams) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: UpdateAdminRequest) => updateAdmin(params, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: adminKeys.all });
			queryClient.invalidateQueries({ queryKey: adminKeys.detail(params.id) });
		},
	});
};

export const useDeleteAdminMutation = (params: DeleteAdminParams) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => deleteAdmin(params),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: adminKeys.all });
		},
	});
};
