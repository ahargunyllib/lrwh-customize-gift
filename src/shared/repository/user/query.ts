"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUser, updatePassword, updateUser } from "./action";
import type {
	GetUserParams,
	UpdatePasswordParams,
	UpdatePasswordRequest,
	UpdateUserParams,
	UpdateUserRequest,
} from "./dto";

export const useGetUserQuery = (params: GetUserParams) => {
	return useQuery({
		queryKey: ["user", params.id],
		queryFn: () => getUser(params),
		enabled: !!params.id,
	});
};

export const useUpdateUserMutation = (params: UpdateUserParams) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: UpdateUserRequest) => updateUser(params, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["user", params.id] });
		},
	});
};

export const useUpdatePasswordMutation = (params: UpdatePasswordParams) => {
	return useMutation({
		mutationFn: (data: UpdatePasswordRequest) => updatePassword(params, data),
	});
};
