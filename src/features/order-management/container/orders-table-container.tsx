"use client";

import DataTablePagination from "@/shared/components/data-table-pagination";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { useDialogStore } from "@/shared/hooks/use-dialog";
import { useGetOrdersQuery } from "@/shared/repository/order/query";
import type { SortingState } from "@tanstack/react-table";
import { parseAsInteger, useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import OrderTable from "../components/order-table";
import AddOrderDialogContainer from "./add-order-dialog-container";

export default function OrdersTableContainer() {
	const [search, setSearch] = useQueryState("search", { defaultValue: "" });
	const [status, setStatus] = useQueryState("status", { defaultValue: "all" });
	const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
	const [limit, setLimit] = useQueryState(
		"limit",
		parseAsInteger.withDefault(10),
	);
	const [sorting, setSorting] = useState<SortingState>([]);

	const sortBy = useMemo(() => {
		if (sorting.length === 0) return undefined;

		return sorting[0].id as "orderNumber" | "username" | "createdAt";
	}, [sorting]);

	const sortOrder = useMemo(() => {
		if (sorting.length === 0) return undefined;

		return sorting[0].desc ? "desc" : "asc";
	}, [sorting]);

	const debouncedSearch = useDebounce(search, 300);

	// Reset page to 1 when status changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: status is intentionally included to trigger reset
	useEffect(() => {
		setPage(1);
	}, [status, setPage]);

	const { data: res, isLoading } = useGetOrdersQuery({
		search: debouncedSearch,
		page,
		limit,
		sortBy,
		sortOrder,
		status: status as "all" | "completed" | "progress" | "no-images",
	});

	const { openDialog } = useDialogStore();

	return (
		<div className="rounded-md border">
			<div className="flex justify-between items-center px-2 py-4">
				<div className="flex gap-2">
					<Input
						placeholder="Search"
						value={search || ""}
						onChange={(e) => setSearch(e.target.value)}
						className="max-w-sm"
					/>
					<Select value={status} onValueChange={setStatus}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Filter by status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Status</SelectItem>
							<SelectItem value="progress">Progress</SelectItem>
							<SelectItem value="completed">Completed</SelectItem>
							<SelectItem value="no-images">No Images</SelectItem>
						</SelectContent>
					</Select>
				</div>

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
						<OrderTable
							data={res.data.orders}
							sorting={sorting}
							onSortingChangeAction={setSorting}
						/>
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
