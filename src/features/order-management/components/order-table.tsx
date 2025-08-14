"use client";

import { Button } from "@/shared/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/components/ui/table";
import { useDialogStore } from "@/shared/hooks/use-dialog";
import type { Order } from "@/shared/types";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";
import AddOrderDialogContainer from "../container/add-order-dialog-container";
import { DataTablePagination } from "./order-table-pagination";
import SearchFilter from "./search-filter";

type OrderColumn = Order;

export const columns: ColumnDef<OrderColumn>[] = [
	{
		accessorKey: "id",
		header: "ID",
	},
	{
		accessorKey: "orderNumber",
		header: "Order Number",
	},
	{
		accessorKey: "username",
		header: "Username",
	},
	{
		accessorKey: "createdAt",
		header: "Created At",
		cell(props) {
			const date = new Date(props.getValue() as string);
			return (
				<span>
					{date.toLocaleDateString("en-US", {
						year: "numeric",
						month: "short",
						day: "2-digit",
						hour: "2-digit",
						minute: "2-digit",
					})}
				</span>
			);
		},
	},
];

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
}

export function DataTable<TData, TValue>({
	columns,
	data,
}: DataTableProps<TData, TValue>) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	const { openDialog } = useDialogStore();

	return (
		<div className="rounded-md border">
			<div className="flex justify-between items-center px-2 py-4">
				<SearchFilter />

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
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								return (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow
								key={row.id}
								data-state={row.getIsSelected() && "selected"}
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
			<div className="p-2 pt-3 border-t">
				<DataTablePagination table={table} />
			</div>
		</div>
	);
}
