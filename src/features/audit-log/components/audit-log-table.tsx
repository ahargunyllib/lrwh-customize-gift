"use client";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import type { AuditLog } from "@/shared/types";
import { format } from "date-fns";

type AuditLogTableProps = {
	data: AuditLog[];
};

const actionColors = {
	CREATE: "bg-green-100 text-green-800",
	UPDATE: "bg-blue-100 text-blue-800",
	DELETE: "bg-red-100 text-red-800",
} as const;

const entityTypeLabels = {
	product: "Product",
	product_variant: "Product Variant",
	order: "Order",
	template: "Template",
} as const;

export default function AuditLogTable({ data }: AuditLogTableProps) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Date/Time</TableHead>
					<TableHead>User</TableHead>
					<TableHead>Action</TableHead>
					<TableHead>Entity Type</TableHead>
					<TableHead>Entity Name</TableHead>
					<TableHead>Entity ID</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{data.length === 0 ? (
					<TableRow>
						<TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
							No audit logs found
						</TableCell>
					</TableRow>
				) : (
					data.map((log) => (
						<TableRow key={log.id}>
							<TableCell className="whitespace-nowrap">
								{format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
							</TableCell>
							<TableCell>
								{log.user?.name || "Unknown"}
								<br />
								<span className="text-xs text-muted-foreground">
									{log.user?.email}
								</span>
							</TableCell>
							<TableCell>
								<Badge className={actionColors[log.action]} variant="secondary">
									{log.action}
								</Badge>
							</TableCell>
							<TableCell>{entityTypeLabels[log.entityType]}</TableCell>
							<TableCell>{log.entityName || "-"}</TableCell>
							<TableCell className="font-mono text-xs max-w-[200px] truncate">
								{log.entityId}
							</TableCell>
						</TableRow>
					))
				)}
			</TableBody>
		</Table>
	);
}
