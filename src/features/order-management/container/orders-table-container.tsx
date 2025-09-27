"use client";

import DataTablePagination from "@/shared/components/data-table-pagination";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { useDialogStore } from "@/shared/hooks/use-dialog";
import { useGetOrdersQuery } from "@/shared/repository/order/query";
import { parseAsInteger, useQueryState } from "nuqs";
import OrderTable from "../components/order-table";
import AddOrderDialogContainer from "./add-order-dialog-container";

export default function OrdersTableContainer() {
	const [search, setSearch] = useQueryState("search", { defaultValue: "" });
	const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
	const [limit, setLimit] = useQueryState(
		"limit",
		parseAsInteger.withDefault(10),
	);

	const debouncedSearch = useDebounce(search, 300);

	const { data: res, isLoading } = useGetOrdersQuery({
		search: debouncedSearch,
		page,
		limit,
	});

	const { openDialog } = useDialogStore();

	return (
		<div className="rounded-md border">
			<div className="flex justify-between items-center px-2 py-4">
				<Input
					placeholder="Search"
					value={search || ""}
					onChange={(e) => setSearch(e.target.value)}
					className="max-w-sm"
				/>

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
							setPage={setPage}
							setLimit={setLimit}
						/>
					</>
				) : (
					"Failed to fetch orders"
				)}
			</div>
		</div>
	);
}
