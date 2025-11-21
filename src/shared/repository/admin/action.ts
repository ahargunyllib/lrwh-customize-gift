"use server";

import { db } from "@/server/db";
import { usersTable } from "@/server/db/schema/users";
import { hash } from "bcrypt-ts";
import { eq } from "drizzle-orm";
import { tryCatch } from "../../lib/try-catch";
import type { ApiResponse } from "../../types";
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
			return {
				success: false,
				error: "Email already exists",
				message: "Email already exists",
			};
		}
		return {
			success: false,
			error: createErr.message,
			message: "Failed to create admin",
		};
	}

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
			return {
				success: false,
				error: "Email already exists",
				message: "Email already exists",
			};
		}
		return {
			success: false,
			error: updateErr.message,
			message: "Failed to update admin",
		};
	}

	return {
		success: true,
		data: null,
		message: "Admin updated successfully",
	};
};

export const deleteAdmin = async (
	params: DeleteAdminParams,
): Promise<ApiResponse<null>> => {
	const { error: deleteErr } = await tryCatch(
		db.delete(usersTable).where(eq(usersTable.id, params.id)),
	);

	if (deleteErr) {
		return {
			success: false,
			error: deleteErr.message,
			message: "Failed to delete admin",
		};
	}

	return {
		success: true,
		data: null,
		message: "Admin deleted successfully",
	};
};
