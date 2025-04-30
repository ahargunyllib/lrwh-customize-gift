"use client";

import { useQuery } from "@tanstack/react-query";
import { getSession } from "./action";

export const useSessionQuery = () => {
	return useQuery({
		queryKey: ["auth-session-manager"],
		queryFn: getSession,
	});
};
