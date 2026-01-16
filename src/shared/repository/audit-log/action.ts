"use server";

import { db } from "@/server/db";
import { auditLogsTable } from "@/server/db/schema/audit-logs";
import { usersTable } from "@/server/db/schema/users";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { logOperation } from "../../lib/logger";
import { tryCatch } from "../../lib/try-catch";
import type { ApiResponse, Pagination } from "../../types";
import type {
	CreateAuditLogRequest,
	GetAuditLogsQuery,
	GetAuditLogsResponse,
} from "./dto";

export const getAuditLogs = async (
	query: GetAuditLogsQuery,
): Promise<ApiResponse<GetAuditLogsResponse>> => {
	const conditions = [];

	if (query.search) {
		conditions.push(
			or(
				ilike(auditLogsTable.entityName, `%${query.search}%`),
				ilike(auditLogsTable.entityId, `%${query.search}%`),
			),
		);
	}

	if (query.action) {
		conditions.push(eq(auditLogsTable.action, query.action));
	}

	if (query.entityType) {
		conditions.push(eq(auditLogsTable.entityType, query.entityType));
	}

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	const { data: auditLogs, error: fetchErr } = await tryCatch(
		db
			.select({
				id: auditLogsTable.id,
				userId: auditLogsTable.userId,
				action: auditLogsTable.action,
				entityType: auditLogsTable.entityType,
				entityId: auditLogsTable.entityId,
				entityName: auditLogsTable.entityName,
				details: auditLogsTable.details,
				createdAt: auditLogsTable.createdAt,
				userName: usersTable.name,
				userEmail: usersTable.email,
			})
			.from(auditLogsTable)
			.leftJoin(usersTable, eq(auditLogsTable.userId, usersTable.id))
			.where(whereClause)
			.orderBy(desc(auditLogsTable.createdAt))
			.limit(query.limit || 10)
			.offset(((query.page || 1) - 1) * (query.limit || 10)),
	);

	if (fetchErr) {
		return {
			success: false,
			error: fetchErr.message,
			message: "Failed to fetch audit logs",
		};
	}

	const { data: meta, error: countErr } = await tryCatch(
		db
			.select({ count: count(auditLogsTable.id) })
			.from(auditLogsTable)
			.where(whereClause),
	);

	if (countErr) {
		return {
			success: false,
			error: countErr.message,
			message: "Failed to count audit logs",
		};
	}

	const formattedLogs = auditLogs.map((log) => ({
		id: log.id,
		userId: log.userId,
		action: log.action as "CREATE" | "UPDATE" | "DELETE",
		entityType: log.entityType as
			| "product"
			| "product_variant"
			| "order"
			| "template",
		entityId: log.entityId,
		entityName: log.entityName,
		details: log.details as Record<string, unknown> | null,
		createdAt: log.createdAt,
		user: log.userName
			? {
					id: log.userId,
					name: log.userName,
					email: log.userEmail || "",
				}
			: undefined,
	}));

	const pagination: Pagination = {
		total_data: meta[0].count,
		total_page: Math.ceil(meta[0].count / (query.limit || 10)),
		page: query.page || 1,
		limit: query.limit || 10,
	};

	return {
		success: true,
		data: {
			auditLogs: formattedLogs,
			meta: {
				pagination,
			},
		},
		message: "Audit logs fetched successfully",
	};
};

export const createAuditLog = async (
	data: CreateAuditLogRequest,
): Promise<ApiResponse<null>> => {
	const startTime = Date.now();

	const baseContext = {
		operation: "auditLog.create",
		entityId: data.entityId,
		userId: data.userId,
	};

	const { error: createErr } = await tryCatch(
		db.insert(auditLogsTable).values({
			userId: data.userId,
			action: data.action,
			entityType: data.entityType,
			entityId: data.entityId,
			entityName: data.entityName,
			details: data.details,
		}),
	);

	if (createErr) {
		logOperation({
			...baseContext,
			success: false,
			error: createErr.message,
			errorStack: createErr.stack,
			duration: Date.now() - startTime,
		});
		return {
			success: false,
			error: createErr.message,
			message: "Failed to create audit log",
		};
	}

	logOperation({
		...baseContext,
		success: true,
		duration: Date.now() - startTime,
	});

	return {
		success: true,
		data: null,
		message: "Audit log created successfully",
	};
};
