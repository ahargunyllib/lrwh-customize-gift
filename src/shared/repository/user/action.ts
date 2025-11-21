"use server";

import { db } from "@/server/db";
import { usersTable } from "@/server/db/schema/users";
import { compare, hash } from "bcrypt-ts";
import { eq } from "drizzle-orm";
import { tryCatch } from "../../lib/try-catch";
import type { ApiResponse } from "../../types";
import type {
	GetUserParams,
	GetUserResponse,
	UpdatePasswordParams,
	UpdatePasswordRequest,
	UpdateUserParams,
	UpdateUserRequest,
} from "./dto";

export const getUser = async (
	params: GetUserParams,
): Promise<ApiResponse<GetUserResponse>> => {
	const { data: users, error: fetchUserErr } = await tryCatch(
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

	if (fetchUserErr) {
		return {
			success: false,
			error: fetchUserErr.message,
			message: "Failed to fetch user",
		};
	}

	if (!users || users.length === 0) {
		return {
			success: false,
			error: "User not found",
			message: "User not found",
		};
	}

	return {
		success: true,
		data: {
			user: {
				...users[0],
				createdAt: users[0].createdAt.toISOString(),
			},
		},
		message: "User fetched successfully",
	};
};

export const updateUser = async (
	params: UpdateUserParams,
	data: UpdateUserRequest,
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
		return {
			success: false,
			error: updateErr.message,
			message: "Failed to update user",
		};
	}

	return {
		success: true,
		data: null,
		message: "Profile updated successfully",
	};
};

export const updatePassword = async (
	params: UpdatePasswordParams,
	data: UpdatePasswordRequest,
): Promise<ApiResponse<null>> => {
	const { data: users, error: fetchErr } = await tryCatch(
		db
			.select({ password: usersTable.password })
			.from(usersTable)
			.where(eq(usersTable.id, params.id)),
	);

	if (fetchErr || !users || users.length === 0) {
		return {
			success: false,
			error: "User not found",
			message: "User not found",
		};
	}

	const isPasswordValid = await compare(data.currentPassword, users[0].password);
	if (!isPasswordValid) {
		return {
			success: false,
			error: "Invalid current password",
			message: "Current password is incorrect",
		};
	}

	const hashedPassword = await hash(data.newPassword, 10);

	const { error: updateErr } = await tryCatch(
		db
			.update(usersTable)
			.set({ password: hashedPassword })
			.where(eq(usersTable.id, params.id)),
	);

	if (updateErr) {
		return {
			success: false,
			error: updateErr.message,
			message: "Failed to update password",
		};
	}

	return {
		success: true,
		data: null,
		message: "Password updated successfully",
	};
};
