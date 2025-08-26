"use client";

import DataTablePagination from "@/shared/components/data-table-pagination";
import { Button } from "@/shared/components/ui/button";
import { useDialogStore } from "@/shared/hooks/use-dialog";
import { useGetOrdersQuery } from "@/shared/repository/order/query";
import { useSearchParams } from "next/navigation";
import OrderTable from "../components/order-table";
import AddOrderDialogContainer from "./add-order-dialog-container";

export default function OrdersTableContainer() {
	const searchParams = useSearchParams();

	const search = searchParams.get("search") || "";
	const page = Number(searchParams.get("page")) || 1;
	const limit = Number(searchParams.get("limit")) || 10;

	const { data: res, isLoading } = useGetOrdersQuery({
		search,
		page,
		limit,
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
					<>
						<OrderTable data={res.data.orders} />
						<DataTablePagination
							currentPage={page}
							totalPages={res.data.meta.pagination.total_page}
							limit={limit}
						/>
					</>
				) : (
					"Failed to fetch orders"
				)}
			</div>
		</div>
	);
}
