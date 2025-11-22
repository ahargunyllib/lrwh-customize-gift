"use client";

import DataTablePagination from "@/shared/components/data-table-pagination";
import { Input } from "@/shared/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import { useDebounce } from "@/shared/hooks/use-debounce";
import type { GetAuditLogsQuery } from "@/shared/repository/audit-log/dto";
import { useGetAuditLogsQuery } from "@/shared/repository/audit-log/query";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import AuditLogTable from "../components/audit-log-table";

export default function AuditLogContainer() {
	const [search, setSearch] = useQueryState("search", { defaultValue: "" });
	const [action, setAction] = useQueryState("action", { defaultValue: "" });
	const [entityType, setEntityType] = useQueryState("entityType", { defaultValue: "" });
	const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
	const [limit, setLimit] = useQueryState("limit", parseAsInteger.withDefault(10));

	const debouncedSearch = useDebounce(search, 300);

	const query: GetAuditLogsQuery = {
		search: debouncedSearch || undefined,
		action: action ? (action as "CREATE" | "UPDATE" | "DELETE") : undefined,
		entityType: entityType ? (entityType as "product" | "product_variant" | "order" | "template") : undefined,
		page,
		limit,
	};

	const { data: res, isLoading } = useGetAuditLogsQuery(query);

	return (
		<div className="rounded-md border">
			<div className="flex flex-wrap gap-4 items-center px-2 py-4">
				<Input
					placeholder="Search by entity name or ID..."
					value={search || ""}
					onChange={(e) => {
						setSearch(e.target.value);
						setPage(1);
					}}
					className="max-w-sm"
				/>

				<Select
					value={action || "all"}
					onValueChange={(value) => {
						setAction(value === "all" ? "" : value);
						setPage(1);
					}}
				>
					<SelectTrigger className="w-[150px]">
						<SelectValue placeholder="Action" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Actions</SelectItem>
						<SelectItem value="CREATE">Create</SelectItem>
						<SelectItem value="UPDATE">Update</SelectItem>
						<SelectItem value="DELETE">Delete</SelectItem>
					</SelectContent>
				</Select>

				<Select
					value={entityType || "all"}
					onValueChange={(value) => {
						setEntityType(value === "all" ? "" : value);
						setPage(1);
					}}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Entity Type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Types</SelectItem>
						<SelectItem value="product">Product</SelectItem>
						<SelectItem value="product_variant">Product Variant</SelectItem>
						<SelectItem value="order">Order</SelectItem>
						<SelectItem value="template">Template</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="p-2">
				{isLoading ? (
					"Loading..."
				) : res?.success ? (
					<>
						<AuditLogTable data={res.data.auditLogs} />
						<DataTablePagination
							currentPage={page}
							totalPages={res.data.meta.pagination.total_page}
							limit={limit}
							setPage={setPage}
							setLimit={setLimit}
						/>
					</>
				) : (
					"Failed to fetch audit logs"
				)}
			</div>
		</div>
	);
}
