"use client";

import { Badge } from "@/shared/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/components/ui/table";
import type { AuditLog } from "@/shared/types";
import { format } from "date-fns";
import { EyeIcon } from "lucide-react";
import { Button } from "../../../shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../../../shared/components/ui/dialog";

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
					<TableHead>Detail</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{data.length === 0 ? (
					<TableRow>
						<TableCell
							colSpan={6}
							className="text-center py-8 text-muted-foreground"
						>
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
							<TableCell>
								<Dialog>
									<DialogTrigger asChild>
										<Button size="icon" variant="ghost">
											<EyeIcon />
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Audit Log Details</DialogTitle>
                      <DialogDescription>
                        Details for entity ID: {log.entityId}
                      </DialogDescription>
										</DialogHeader>
										<pre className="max-h-[80vh] overflow-auto text-xs rounded-sm p-2 bg-muted border text-muted-foreground">
											<code>{JSON.stringify(log.details, null, 2)}</code>
										</pre>
									</DialogContent>
								</Dialog>
							</TableCell>
						</TableRow>
					))
				)}
			</TableBody>
		</Table>
	);
}
