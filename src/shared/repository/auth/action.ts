"use server";

import { encodeToken } from "../../lib/decode";
import type { ApiResponse } from "../../types";
import { destroySession } from "../session-manager/action";
import type { TLoginRequest, TLoginResponse } from "./dto";

export async function login(
	payload: TLoginRequest,
): Promise<ApiResponse<TLoginResponse>> {
	const admins = [
		{
			user_id: "1",
			email: "admin@gmail.com",
			password: "password",
			role: 1,
		},
	];

	const isAdmin = admins.find((admin) => {
		return admin.email === payload.email && admin.password === payload.password;
	});

	if (!isAdmin) {
		return {
			success: false,
			error: "Unauthorized",
			message: "Invalid email or password",
		};
	}

	const session = {
		user_id: isAdmin.user_id,
		email: isAdmin.email,
		role: isAdmin.role,
	};

	const access_token = await encodeToken(session);

	return {
		success: true,
		data: {
			access_token,
		},
		message: "Login successful",
	};
}

export async function logout() {
	await destroySession();
}
