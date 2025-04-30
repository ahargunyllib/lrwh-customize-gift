"use client";

import { useSessionQuery } from "@/shared/repository/session-manager/query";

export default function Page() {
	const { data: res, isLoading } = useSessionQuery();

	return <section>{JSON.stringify(res)}</section>;
}
