"use client";

import { Button } from "@/shared/components/ui/button";
import { useDialogStore } from "@/shared/hooks/use-dialog";
import { useGetOrdersQuery } from "@/shared/repository/order/query";
import { useSearchParams } from "next/navigation";
import OrderTable from "../components/order-table";
import AddOrderDialogContainer from "./add-order-dialog-container";

export default function OrdersTableContainer() {
	const sp = useSearchParams();

	const { data: res, isLoading } = useGetOrdersQuery({
		search: sp.get("search") || "",
		page: Number(sp.get("page")) || 1,
		limit: Number(sp.get("limit")) || 10,
	});

	const { openDialog } = useDialogStore();

	return (
		<div className="rounded-md border">
			<div className="flex justify-between items-center px-2 py-4">
				<div className="invisible">{/* <SearchFilter /> */}</div>

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
			<div className="p-2">
				{isLoading ? (
					"Loading..."
				) : res?.success ? (
					<OrderTable data={res.data.orders} />
				) : (
					"Failed to fetch orders"
				)}
			</div>
		</div>
	);
}
