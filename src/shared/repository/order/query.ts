"use client";

import { useQuery } from "@tanstack/react-query";
import { getOrders } from "./action";
import type { GetOrdersQuery } from "./dto";

export const useGetOrdersQuery = (query: GetOrdersQuery) => {
	return useQuery({
		queryKey: ["orders", query],
		queryFn: () => getOrders(query),
	});
};
