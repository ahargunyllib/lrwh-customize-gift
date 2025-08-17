"use client";

import OrderTable from "@/features/order-management/components/order-table";
import AddOrderDialogContainer from "@/features/order-management/container/add-order-dialog-container";
import { Button } from "@/shared/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { useDialogStore } from "@/shared/hooks/use-dialog";
import { useGetOrdersQuery } from "@/shared/repository/order/query";
import { useSearchParams } from "next/navigation";
import { Fragment, Suspense } from "react";

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
				<Suspense>
					<OrderContainer />
				</Suspense>
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

	const { openDialog } = useDialogStore();

	if (isLoading) return <div>Loading...</div>;

	if (!res?.data) return <div>No data</div>;

	const orders = res.data.orders;

	return (
		<Fragment>
			<div className="flex justify-between items-center px-2 py-4">
				<Button
					variant="outline"
					onClick={() => {
						openDialog({
							children: <AddOrderDialogContainer />,
						});
					}}
				>
					Add Order
				</Button>
			</div>
			<OrderTable data={orders} />
		</Fragment>
	);
}
