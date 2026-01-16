"use server";

import { db } from "@/server/db";
import { usersTable } from "@/server/db/schema/users";
import { compare } from "bcrypt-ts";
import { eq } from "drizzle-orm";
import { encodeToken } from "../../lib/decode";
import { logOperation } from "../../lib/logger";
import type { ApiResponse } from "../../types";
import { destroySession, getSession } from "../session-manager/action";
import type { TLoginRequest, TLoginResponse } from "./dto";

export async function login(
	payload: TLoginRequest,
): Promise<ApiResponse<TLoginResponse>> {
	const startTime = Date.now();

	const baseContext = {
		operation: "auth.login",
		userId: undefined as number | undefined,
	};

	const [user] = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.email, payload.email))
		.execute();
	if (!user) {
		logOperation({
			...baseContext,
			success: false,
			error: "Unauthorized",
			duration: Date.now() - startTime,
		});
		return {
			success: false,
			error: "Unauthorized",
			message: "Invalid email or password",
		};
	}

	const isPasswordValid = await compare(payload.password, user.password);
	if (!isPasswordValid) {
		logOperation({
			...baseContext,
			userId: user.id,
			success: false,
			error: "Unauthorized",
			duration: Date.now() - startTime,
		});
		return {
			success: false,
			error: "Unauthorized",
			message: "Invalid email or password",
		};
	}

	const session = {
		user_id: user.id,
		email: user.email,
		role: user.role,
	};

	const access_token = await encodeToken(session);

	logOperation({
		...baseContext,
		userId: user.id,
		success: true,
		duration: Date.now() - startTime,
	});

	return {
		success: true,
		data: {
			access_token,
		},
		message: "Login successful",
	};
}

export async function logout() {
	const startTime = Date.now();
	const session = await getSession();

	const baseContext = {
		operation: "auth.logout",
		userId: session.isLoggedIn ? Number(session.userId) : undefined,
	};

	await destroySession();

	logOperation({
		...baseContext,
		success: true,
		duration: Date.now() - startTime,
	});
}
