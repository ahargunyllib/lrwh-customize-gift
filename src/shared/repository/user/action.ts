"use server";

import { db } from "@/server/db";
import { usersTable } from "@/server/db/schema/users";
import { compare, hash } from "bcrypt-ts";
import { eq } from "drizzle-orm";
import { logOperation } from "../../lib/logger";
import { tryCatch } from "../../lib/try-catch";
import type { ApiResponse } from "../../types";
import { getSession } from "../session-manager/action";
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
	const startTime = Date.now();
	const session = await getSession();

	const baseContext = {
		operation: "user.update",
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
			message: "Failed to update user",
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
		message: "Profile updated successfully",
	};
};

export const updatePassword = async (
	params: UpdatePasswordParams,
	data: UpdatePasswordRequest,
): Promise<ApiResponse<null>> => {
	const startTime = Date.now();
	const session = await getSession();

	const baseContext = {
		operation: "user.updatePassword",
		entityId: String(params.id),
		userId: session.isLoggedIn ? Number(session.userId) : undefined,
	};

	const { data: users, error: fetchErr } = await tryCatch(
		db
			.select({ password: usersTable.password })
			.from(usersTable)
			.where(eq(usersTable.id, params.id)),
	);

	if (fetchErr || !users || users.length === 0) {
		logOperation({
			...baseContext,
			success: false,
			error: "User not found",
			duration: Date.now() - startTime,
		});
		return {
			success: false,
			error: "User not found",
			message: "User not found",
		};
	}

	const isPasswordValid = await compare(
		data.currentPassword,
		users[0].password,
	);
	if (!isPasswordValid) {
		logOperation({
			...baseContext,
			success: false,
			error: "Invalid current password",
			duration: Date.now() - startTime,
		});
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
			message: "Failed to update password",
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
		message: "Password updated successfully",
	};
};
