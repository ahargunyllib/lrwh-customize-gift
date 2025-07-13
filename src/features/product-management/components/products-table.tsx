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
import {
	useDeleteProductMutation,
	useDeleteProductVariantMutation,
} from "@/shared/repository/product/query";
import type { Product, ProductVariant } from "@/shared/types";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	ChevronDownIcon,
	ChevronRightIcon,
	EditIcon,
	EyeIcon,
	MoreHorizontalIcon,
	PackageIcon,
	Trash2Icon,
} from "lucide-react";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import CreateProductVariantFormDialog from "./create-product-variant-form-dialog";
import UpdateProductFormDialog from "./update-product-form-dialog";
import UpdateProductVariantFormDialog from "./update-product-variant-form-dialog";

type Props = {
	data: (Product & { variants: ProductVariant[] })[];
};

export default function ProductsTable({ data }: Props) {
	const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

	const toggleRowExpansion = (rowId: string) => {
		const newExpanded = new Set(expandedRows);
		if (newExpanded.has(rowId)) {
			newExpanded.delete(rowId);
		} else {
			newExpanded.add(rowId);
		}
		setExpandedRows(newExpanded);
	};

	const columns: ColumnDef<(typeof data)[number]>[] = [
		{
			id: "expand",
			header: "",
			cell: ({ row }) => (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => toggleRowExpansion(row.original.id)}
					className="p-0 h-8 w-8"
				>
					{expandedRows.has(row.original.id) ? (
						<ChevronDownIcon className="h-4 w-4" />
					) : (
						<ChevronRightIcon className="h-4 w-4" />
					)}
				</Button>
			),
			enableSorting: false,
			enableHiding: false,
			size: 10,
		},
		{
			accessorKey: "name",
			header: "Name",
		},
		{
			id: "actions",
			enableHiding: false,
			size: 10,
			cell: ({ row }) => {
				const product = row.original;

				const { openDialog } = useDialogStore();

				const { mutate: deleteProduct, isPending } = useDeleteProductMutation({
					id: product.id,
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
											children: (
												<UpdateProductFormDialog product={product} readonly />
											),
										});
									}}
								>
									<EyeIcon className="mr-2 h-4 w-4" />
									View details
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => {
										openDialog({
											children: <UpdateProductFormDialog product={product} />,
										});
									}}
								>
									<EditIcon className="mr-2 h-4 w-4" />
									Edit product
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
									Are you sure you want to delete this product?
								</AlertDialogTitle>
								<AlertDialogDescription>
									This action cannot be undone. This will also{" "}
									<b>delete all associated variants and orders.</b>
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									disabled={isPending}
									onClick={() => {
										deleteProduct(undefined, {
											onSuccess: (res) => {
												if (!res.success) {
													toast.error(res.error || "Failed to delete product");
													return;
												}

												toast.success(
													res.message || "Product deleted successfully",
												);
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
			},
		},
	];

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	const { openDialog } = useDialogStore();

	return (
		<Table>
			<TableHeader>
				{table.getHeaderGroups().map((headerGroup) => (
					<TableRow key={headerGroup.id} className="border-b border-gray-200">
						{headerGroup.headers.map((header) => {
							return (
								<TableHead
									key={header.id}
									className="font-semibold text-gray-900"
									style={{
										width: header.column.columnDef.size || "auto",
										minWidth: header.column.columnDef.size || "auto",
										maxWidth: header.column.columnDef.size || "auto",
									}}
								>
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
					<>
						{table.getRowModel().rows.map((row) => (
							<Fragment key={row.id}>
								<TableRow
									data-state={row.getIsSelected() && "selected"}
									className="border-b border-gray-100 hover:bg-gray-50"
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className="py-4"
											style={{
												width: cell.column.columnDef.size || "auto",
												minWidth: cell.column.columnDef.size || "auto",
												maxWidth: cell.column.columnDef.size || "auto",
											}}
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
								{expandedRows.has(row.original.id) && (
									<TableRow className="bg-gray-50">
										<TableCell colSpan={columns.length} className="p-0">
											<div className="px-6 py-4 space-y-2">
												<div className="flex flex-row items-center justify-between">
													<h4 className="font-medium text-gray-900 mb-3">
														Product Variants
													</h4>
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															openDialog({
																children: (
																	<CreateProductVariantFormDialog
																		product={row.original}
																	/>
																),
															});
														}}
													>
														Add Variant
													</Button>
												</div>
												<div className="space-y-2">
													{row.original.variants.length === 0 && (
														<p className="text-gray-500">
															No variants available.
														</p>
													)}
													{row.original.variants.map((variant) => {
														return (
															<ProductVariantList
																variant={variant}
																key={variant.id}
															/>
														);
													})}
												</div>
											</div>
										</TableCell>
									</TableRow>
								)}
							</Fragment>
						))}
					</>
				) : (
					<TableRow>
						<TableCell colSpan={columns.length} className="h-24 text-center">
							No results.
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
}

function ProductVariantList({
	variant,
}: {
	variant: ProductVariant;
}) {
	const { openDialog } = useDialogStore();

	const { mutate: deleteProductVariant, isPending } =
		useDeleteProductVariantMutation({
			productId: variant.productId,
			variantId: variant.id,
		});

	return (
		<div
			key={variant.id}
			className="flex items-center justify-between p-3 bg-white rounded-md border"
		>
			<div className="flex items-center space-x-3">
				<div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center">
					<PackageIcon className="h-4 w-4 text-gray-500" />
				</div>
				<div>
					<div className="font-medium text-sm">
						{variant.name} ({variant.width}x{variant.height})
					</div>
				</div>
			</div>
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
									children: (
										<UpdateProductVariantFormDialog
											variant={variant}
											readonly
										/>
									),
								});
							}}
						>
							<EyeIcon className="mr-2 h-4 w-4" />
							View details
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => {
								openDialog({
									children: (
										<UpdateProductVariantFormDialog variant={variant} />
									),
								});
							}}
						>
							<EditIcon className="mr-2 h-4 w-4" />
							Edit variant
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
							Are you sure you want to delete this variant?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will also{" "}
							<b>delete all associated orders for this variant.</b>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							disabled={isPending}
							onClick={() => {
								deleteProductVariant(undefined, {
									onSuccess: (res) => {
										if (!res.success) {
											toast.error(
												res.error || "Failed to delete product variant",
											);
											return;
										}

										toast.success(
											res.message || "Product variant deleted successfully",
										);
									},
								});
							}}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
