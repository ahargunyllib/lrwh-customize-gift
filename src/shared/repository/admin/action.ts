"use server";

import { db } from "@/server/db";
import { usersTable } from "@/server/db/schema/users";
import { hash } from "bcrypt-ts";
import { eq } from "drizzle-orm";
import { logOperation } from "../../lib/logger";
import { tryCatch } from "../../lib/try-catch";
import type { ApiResponse } from "../../types";
import { getSession } from "../session-manager/action";
import type {
	CreateAdminRequest,
	DeleteAdminParams,
	GetAdminParams,
	GetAdminResponse,
	GetAllAdminsResponse,
	UpdateAdminParams,
	UpdateAdminRequest,
} from "./dto";

const ADMIN_ROLE = 1;

export const getAllAdmins = async (): Promise<
	ApiResponse<GetAllAdminsResponse>
> => {
	const { data: admins, error: fetchErr } = await tryCatch(
		db
			.select({
				id: usersTable.id,
				name: usersTable.name,
				email: usersTable.email,
				role: usersTable.role,
				createdAt: usersTable.createdAt,
			})
			.from(usersTable)
			.where(eq(usersTable.role, ADMIN_ROLE)),
	);

	if (fetchErr) {
		return {
			success: false,
			error: fetchErr.message,
			message: "Failed to fetch admins",
		};
	}

	return {
		success: true,
		data: {
			admins: admins.map((admin) => ({
				...admin,
				createdAt: admin.createdAt.toISOString(),
			})),
		},
		message: "Admins fetched successfully",
	};
};

export const getAdmin = async (
	params: GetAdminParams,
): Promise<ApiResponse<GetAdminResponse>> => {
	const { data: admins, error: fetchErr } = await tryCatch(
		db
			.select({
				id: usersTable.id,
				name: usersTable.name,
				email: usersTable.email,
				role: usersTable.role,
				createdAt: usersTable.createdAt,
			})
			.from(usersTable)
			.where(eq(usersTable.id, params.id)),
	);

	if (fetchErr) {
		return {
			success: false,
			error: fetchErr.message,
			message: "Failed to fetch admin",
		};
	}

	if (!admins || admins.length === 0) {
		return {
			success: false,
			error: "Admin not found",
			message: "Admin not found",
		};
	}

	return {
		success: true,
		data: {
			admin: {
				...admins[0],
				createdAt: admins[0].createdAt.toISOString(),
			},
		},
		message: "Admin fetched successfully",
	};
};

export const createAdmin = async (
	data: CreateAdminRequest,
): Promise<ApiResponse<null>> => {
	const startTime = Date.now();
	const session = await getSession();

	const baseContext = {
		operation: "admin.create",
		userId: session.isLoggedIn ? Number(session.userId) : undefined,
	};

	const hashedPassword = await hash(data.password, 10);

	const { error: createErr } = await tryCatch(
		db.insert(usersTable).values({
			name: data.name,
			email: data.email,
			password: hashedPassword,
			role: ADMIN_ROLE,
		}),
	);

	if (createErr) {
		if (createErr.message.includes("unique")) {
			logOperation({
				...baseContext,
				success: false,
				error: "Email already exists",
				duration: Date.now() - startTime,
			});
			return {
				success: false,
				error: "Email already exists",
				message: "Email already exists",
			};
		}
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
			message: "Failed to create admin",
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
		message: "Admin created successfully",
	};
};

export const updateAdmin = async (
	params: UpdateAdminParams,
	data: UpdateAdminRequest,
): Promise<ApiResponse<null>> => {
	const startTime = Date.now();
	const session = await getSession();

	const baseContext = {
		operation: "admin.update",
		entityId: String(params.id),
		userId: session.isLoggedIn ? Number(session.userId) : undefined,
	};

	const { error: updateErr } = await tryCatch(
		db
			.update(usersTable)
			.set({
				name: data.name,
				email: data.email,
			})
			.where(eq(usersTable.id, params.id)),
	);

	if (updateErr) {
		if (updateErr.message.includes("unique")) {
			logOperation({
				...baseContext,
				success: false,
				error: "Email already exists",
				duration: Date.now() - startTime,
			});
			return {
				success: false,
				error: "Email already exists",
				message: "Email already exists",
			};
		}
		logOperation({
			...baseContext,
			success: false,
			error: updateErr.message,
			errorStack: updateErr.stack,
			duration: Date.now() - startTime,
		});
		return {
			success: false,
			error: updateErr.message,
			message: "Failed to update admin",
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
		message: "Admin updated successfully",
	};
};

export const deleteAdmin = async (
	params: DeleteAdminParams,
): Promise<ApiResponse<null>> => {
	const startTime = Date.now();
	const session = await getSession();

	const baseContext = {
		operation: "admin.delete",
		entityId: String(params.id),
		userId: session.isLoggedIn ? Number(session.userId) : undefined,
	};

	const { error: deleteErr } = await tryCatch(
		db.delete(usersTable).where(eq(usersTable.id, params.id)),
	);

	if (deleteErr) {
		logOperation({
			...baseContext,
			success: false,
			error: deleteErr.message,
			errorStack: deleteErr.stack,
			duration: Date.now() - startTime,
		});
		return {
			success: false,
			error: deleteErr.message,
			message: "Failed to delete admin",
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
		message: "Admin deleted successfully",
	};
};
