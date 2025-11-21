"use client";

import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "./action";
import type { GetAuditLogsQuery } from "./dto";

export const useGetAuditLogsQuery = (query: GetAuditLogsQuery) => {
	return useQuery({
		queryKey: ["audit-logs", query],
		queryFn: () => getAuditLogs(query),
	});
};
