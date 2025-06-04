"use client";

import {
	DataTable,
	columns,
} from "@/features/order-management/components/order-table";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { useGetOrdersQuery } from "@/shared/repository/order/query";
import { useSearchParams } from "next/navigation";

export default function Page() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Order Management</CardTitle>
				<CardDescription>
					Manage your orders efficiently with our comprehensive order management
					system.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<OrderContainer />
			</CardContent>
		</Card>
	);
}

function OrderContainer() {
	const sp = useSearchParams();

	const { data: res, isLoading } = useGetOrdersQuery({
		search: sp.get("search") || "",
		page: Number(sp.get("page")) || 1,
		limit: Number(sp.get("limit")) || 10,
	});

	if (isLoading) return <div>Loading...</div>;

	if (!res?.data) return <div>No data</div>;

	const orders = res.data.orders;

	return <DataTable columns={columns} data={orders} />;
}
