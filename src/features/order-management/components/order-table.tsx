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
import { tryCatch } from "@/shared/lib/try-catch";
import { cn } from "@/shared/lib/utils";
import type {
	Order,
	OrderProductVariant,
	Product,
	ProductVariant,
} from "@/shared/types";
import {
	type ColumnDef,
	type OnChangeFn,
	type SortingState,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	ChevronDownIcon,
	ChevronRightIcon,
	CopyIcon,
	DownloadIcon,
	EyeIcon,
	FilterIcon,
} from "lucide-react";
import Image from "next/image";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { Badge } from "../../../shared/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../../../shared/components/ui/dialog";

type Props = {
	data: {
		id: Order["id"];
		orderNumber: Order["orderNumber"];
		username: Order["username"];
		createdAt: Order["createdAt"];
		products: {
			id: Product["id"];
			name: Product["name"];
			productVariant: {
				id: ProductVariant["id"];
				name: ProductVariant["name"];
				width: ProductVariant["width"];
				height: ProductVariant["height"];
			};
			imageUrl: OrderProductVariant["imageUrl"];
		}[];
	}[];
	sorting?: SortingState;
	onSortingChangeAction?: OnChangeFn<SortingState>;
};

export default function OrderTable({
	data,
	sorting,
	onSortingChangeAction,
}: Props) {
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

	const columns: ColumnDef<{
		id: Order["id"];
		orderNumber: Order["orderNumber"];
		username: Order["username"];
		createdAt: Order["createdAt"];
		products: {
			id: Product["id"];
			name: Product["name"];
			productVariant: {
				id: ProductVariant["id"];
				name: ProductVariant["name"];
				width: ProductVariant["width"];
				height: ProductVariant["height"];
			};
			imageUrl: OrderProductVariant["imageUrl"];
		}[];
	}>[] = [
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
		{
			header: "Status",
			enableSorting: false,
			cell(props) {
				const { products } = props.row.original;
				const countHavingImages = products.filter((p) => p.imageUrl).length;
				const hasAllImages = countHavingImages === products.length;
				return (
					<div className="flex flex-row items-center gap-2">
						<Badge
							variant={
								hasAllImages
									? "default"
									: countHavingImages === 0
										? "destructive"
										: "secondary"
							}
						>
							{countHavingImages}/{products.length} Images
						</Badge>
						{hasAllImages && (
							<Button
								variant="outline"
								size="icon"
								onClick={async () => {
									for (const product of products) {
										downloadImage(product.imageUrl);
									}
								}}
							>
								<DownloadIcon className="h-4 w-4" />
							</Button>
						)}
					</div>
				);
			},
		},
	];

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		manualSorting: true, //use pre-sorted row model instead of sorted row model
		state: {
			sorting,
		},
		onSortingChange: onSortingChangeAction,
	});

	return (
		<Table>
			<TableHeader>
				{table.getHeaderGroups().map((headerGroup) => (
					<TableRow key={headerGroup.id} className="border-b border-gray-200">
						{headerGroup.headers.map((header) => {
							return (
								<TableHead
									key={header.id}
									className={cn(
										"font-semibold text-gray-900",
										header.column.getCanSort() && "cursor-pointer select-none",
									)}
									style={{
										width: header.column.columnDef.size || "auto",
										minWidth: header.column.columnDef.size || "auto",
										maxWidth: header.column.columnDef.size || "auto",
									}}
									onClick={header.column.getToggleSortingHandler()}
									title={
										header.column.getCanSort()
											? header.column.getNextSortingOrder() === "asc"
												? "Sort ascending"
												: header.column.getNextSortingOrder() === "desc"
													? "Sort descending"
													: "Clear sort"
											: undefined
									}
								>
									{header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
									{{
										asc: " 🔼",
										desc: " 🔽",
									}[header.column.getIsSorted() as string] ?? null}
								</TableHead>
							);
						})}
					</TableRow>
				))}
			</TableHeader>
			<TableBody>
				{table.getRowModel().rows?.length ? (
					table.getRowModel().rows.map((row) => (
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
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
							{expandedRows.has(row.original.id) && (
								<TableRow className="bg-gray-50">
									<TableCell colSpan={columns.length} className="p-0">
										<div className="px-6 py-4 space-y-2">
											<div className="flex flex-row items-center justify-between">
												<h4 className="font-medium text-gray-900 mb-3">
													Products
												</h4>
											</div>
											<div className="space-y-2">
												{row.original.products.length === 0 && (
													<p className="text-gray-500">No products.</p>
												)}
												{row.original.products.map((variant, idx) => {
													return (
														<div
															key={`${variant.id}-${idx}`}
															className="flex items-center justify-between p-2 border border-gray-200 rounded-md bg-background"
														>
															<div className="flex items-center space-x-4">
																{variant.imageUrl ? (
																	<div className="relative w-16 h-16 rounded-md border">
																		<Image
																			src={variant.imageUrl}
																			alt={variant.name}
																			fill
																			className="object-cover"
																		/>
																	</div>
																) : (
																	<div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
																		<span className="text-gray-500 text-xs">
																			No Image
																		</span>
																	</div>
																)}
																<div>
																	<p className="font-medium text-gray-900">
																		{variant.name}
																	</p>
																	<p className="text-sm text-gray-500">
																		{variant.productVariant.name} (
																		{variant.productVariant.width}x
																		{variant.productVariant.height})
																	</p>
																</div>
															</div>
															<div className="flex flex-row items-center gap-x-2">
																<Button
																	size="icon"
																	variant="outline"
																	onClick={() => {
																		const url = new URL(
																			`${window.location.origin}/templates/onboarding`,
																		);
																		url.searchParams.set(
																			"username",
																			row.original.username,
																		);
																		url.searchParams.set(
																			"orderNumber",
																			row.original.orderNumber,
																		);
																		url.searchParams.set(
																			"productVariantId",
																			variant.productVariant.id,
																		);
																		navigator.clipboard.writeText(
																			url.toString(),
																		);
																		toast.success("Link copied to clipboard.");
																	}}
																>
																	<CopyIcon />
																</Button>
																{variant.imageUrl ? (
																	<Dialog>
																		<DialogTrigger asChild>
																			<Button variant="outline" size="icon">
																				<EyeIcon />
																			</Button>
																		</DialogTrigger>
																		<DialogContent>
																			<DialogHeader>
																				<DialogTitle>Image Preview</DialogTitle>
																				<DialogDescription>
																					View the image associated with this
																					order.
																				</DialogDescription>
																			</DialogHeader>
																			<Image
																				src={variant.imageUrl}
																				alt="Order Image"
																				width={500}
																				height={500}
																				className="object-cover border"
																			/>
																			<DialogFooter>
																				<Button
																					onClick={() =>
																						downloadImage(variant.imageUrl)
																					}
																					variant="outline"
																				>
																					Download Image
																				</Button>
																			</DialogFooter>
																		</DialogContent>
																	</Dialog>
																) : null}
															</div>
														</div>
													);
												})}
											</div>
										</div>
									</TableCell>
								</TableRow>
							)}
						</Fragment>
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
	);
}

const downloadImage = async (imageUrl: string | null) => {
	if (!imageUrl) {
		toast.error("No image URL provided.");
		return;
	}

	const key = imageUrl.split("/").pop();

	const { data: response, error: fetchErr } = await tryCatch(
		fetch(`/api/files/${key}`),
	);
	if (fetchErr) {
		toast.error("Failed to fetch the image URL.", {
			description: fetchErr.message,
		});
		return;
	}

	if (!response.ok) {
		toast.error("Failed to download the image.");
		return;
	}

	const { data: blob, error: blobErr } = await tryCatch(response.blob());
	if (blobErr) {
		toast.error("Failed to convert response to blob.");
		return;
	}

	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = imageUrl.split("/").pop() || "image.png";
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
};
