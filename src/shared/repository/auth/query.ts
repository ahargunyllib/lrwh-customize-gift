"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getCookie, setCookie } from "cookies-next/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createSession } from "../session-manager/action";
import { login, logout } from "./action";
import type { TLoginRequest } from "./dto";

export const useLoginMutation = () => {
	const queryClient = useQueryClient();
	const router = useRouter();
	const returnTo = getCookie("returnTo");

	return useMutation({
		mutationKey: ["auth"],
		mutationFn: (data: TLoginRequest) => login(data),
		onSuccess: async (res) => {
			if (!res.success) {
				toast.error(res.message);
				return;
			}

			toast.success(res.message);
			await createSession(res.data.access_token);
			router.replace(returnTo || "/dashboard");
			setCookie("returnTo", "");

			queryClient.refetchQueries({ queryKey: ["auth"] });
		},
	});
};

export const useLogoutMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["auth"],
		mutationFn: () => logout(),
		onSuccess: () => {
			queryClient.resetQueries({ queryKey: ["auth"] });
		},
	});
};
