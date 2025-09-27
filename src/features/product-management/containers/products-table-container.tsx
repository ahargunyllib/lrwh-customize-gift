"use client";

import DataTablePagination from "@/shared/components/data-table-pagination";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { useDialogStore } from "@/shared/hooks/use-dialog";
import type { GetProductsQuery } from "@/shared/repository/product/dto";
import { useGetProductsQuery } from "@/shared/repository/product/query";
import { useSearchParams } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import CreateProductFormDialog from "../components/create-product-form-dialog";
import ProductsTable from "../components/products-table";

export default function ProductsTableContainer() {
	const [search, setSearch] = useQueryState("search", { defaultValue: "" });
	const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
	const [limit, setLimit] = useQueryState(
		"limit",
		parseAsInteger.withDefault(10),
	);

	const debouncedSearch = useDebounce(search, 300);

	const { data: res, isLoading } = useGetProductsQuery({
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
					<>
						<ProductsTable data={res.data.products} />
						<DataTablePagination
							currentPage={page}
							totalPages={res.data.meta.pagination.total_page}
							limit={limit}
							setPage={setPage}
							setLimit={setLimit}
						/>
					</>
				) : (
					"Failed to fetch products"
				)}
			</div>
		</div>
	);
}
