"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/components/ui/table";
import { useDialogStore } from "@/shared/hooks/use-dialog";
import { roleEnum } from "@/shared/lib/enums";
import type { Admin } from "@/shared/repository/admin/dto";
import { useDeleteAdminMutation } from "@/shared/repository/admin/query";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { EditIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { DataTablePagination } from "@/shared/components/data-table-pagination";
import UpdateUserFormDialog from "./update-user-form-dialog";

type Props = {
	data: Admin[];
};

export default function UserTable({ data }: Props) {
	const { openDialog } = useDialogStore();

	const columns: ColumnDef<Admin>[] = [
		{
			accessorKey: "name",
			header: "Name",
		},
		{
			accessorKey: "email",
			header: "Email",
		},
		{
			accessorKey: "role",
			header: "Role",
			cell: ({ row }) => {
				const role = row.original.role;
				return (
					<Badge variant="secondary">
						{roleEnum[role as keyof typeof roleEnum] || "Unknown"}
					</Badge>
				);
			},
		},
		{
			accessorKey: "createdAt",
			header: "Created At",
			cell: ({ row }) => {
				const date = new Date(row.original.createdAt);
				return date.toLocaleDateString("en-US", {
					year: "numeric",
					month: "short",
					day: "numeric",
				});
			},
		},
		{
			id: "actions",
			enableHiding: false,
			size: 50,
			cell: ({ row }) => {
				const admin = row.original;
				return <UserActions admin={admin} />;
			},
		},
	];

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	return (
		<div className="space-y-4">
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id} className="border-b border-gray-200">
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										className="font-semibold text-gray-900"
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
									className="border-b border-gray-100 hover:bg-gray-50"
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} className="py-4">
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No users found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<DataTablePagination table={table} />
		</div>
	);
}

function UserActions({ admin }: { admin: Admin }) {
	const { openDialog } = useDialogStore();
	const { mutate: deleteAdmin, isPending } = useDeleteAdminMutation({
		id: admin.id,
	});

	return (
		<AlertDialog>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="h-8 w-8 p-0">
						<span className="sr-only">Open menu</span>
						<MoreHorizontalIcon className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel>Actions</DropdownMenuLabel>
					<DropdownMenuItem
						onClick={() => {
							openDialog({
								children: <UpdateUserFormDialog admin={admin} />,
							});
						}}
					>
						<EditIcon className="mr-2 h-4 w-4" />
						Edit user
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<AlertDialogTrigger asChild>
						<DropdownMenuItem className="text-red-600">
							<Trash2Icon className="mr-2 h-4 w-4" />
							Delete
						</DropdownMenuItem>
					</AlertDialogTrigger>
				</DropdownMenuContent>
			</DropdownMenu>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						Are you sure you want to delete this user?
					</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete the user
						account.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						disabled={isPending}
						onClick={() => {
							deleteAdmin(undefined, {
								onSuccess: (res) => {
									if (!res.success) {
										toast.error(res.error || "Failed to delete user");
										return;
									}
									toast.success(res.message || "User deleted successfully");
								},
							});
						}}
					>
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
