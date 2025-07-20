"use client";

import { Button } from "@/shared/components/ui/button";
import { useDialogStore } from "@/shared/hooks/use-dialog";
import type { GetProductsQuery } from "@/shared/repository/product/dto";
import { useGetProductsQuery } from "@/shared/repository/product/query";
import { useSearchParams } from "next/navigation";
import CreateProductFormDialog from "../components/create-product-form-dialog";
import ProductsTable from "../components/products-table";

export default function ProductsTableContainer() {
	const searchParams = useSearchParams();

	const search = searchParams.get("search") || "";
	const page = Number(searchParams.get("page")) || 1;
	const limit = Number(searchParams.get("limit")) || 10;

	const query: GetProductsQuery = {
		search,
		page,
		limit,
	};

	const { data: res, isLoading } = useGetProductsQuery(query);

	const { openDialog } = useDialogStore();

	return (
		<div className="rounded-md border">
			<div className="flex justify-between items-center px-2 py-4">
				<div className="invisible">{/* <SearchFilter /> */}</div>

				<Button
					variant="outline"
					onClick={() => {
						openDialog({
							children: <CreateProductFormDialog />,
						});
					}}
				>
					Add Product
				</Button>
			</div>
			<div className="p-2">
				{isLoading ? (
					"Loading..."
				) : res?.success ? (
					<ProductsTable data={res.data.products} />
				) : (
					"Failed to fetch products"
				)}
			</div>
		</div>
	);
}
