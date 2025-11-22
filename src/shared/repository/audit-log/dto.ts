import type { AuditLog, Pagination } from "../../types";

export type GetAuditLogsQuery = {
	search?: string;
	action?: "CREATE" | "UPDATE" | "DELETE";
	entityType?: "product" | "product_variant" | "order" | "template";
	page?: number;
	limit?: number;
};

export type GetAuditLogsResponse = {
	auditLogs: AuditLog[];
	meta: {
		pagination: Pagination;
	};
};

export type CreateAuditLogRequest = {
	userId: number;
	action: "CREATE" | "UPDATE" | "DELETE";
	entityType: "product" | "product_variant" | "order" | "template";
	entityId: string;
	entityName?: string;
	details?: Record<string, unknown>;
};
