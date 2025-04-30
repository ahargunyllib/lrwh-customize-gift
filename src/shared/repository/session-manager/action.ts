"use server";

import { decodeToken } from "@/shared/lib/decode";
import { type SessionData, sessionOptions } from "@/shared/lib/session";
import { type IronSession, getIronSession } from "iron-session";
import { cookies } from "next/headers";

async function _getSession() {
	const session = await getIronSession<SessionData>(
		await cookies(),
		sessionOptions,
	);

	if (!session.isLoggedIn) {
		session.isLoggedIn = false;
	}

	return session;
}

export async function createSession(token: string) {
	const session = await _getSession();
	const decoded = decodeToken(token);

	session.isLoggedIn = true;
	if (session.isLoggedIn) {
		session.userId = decoded.user_id;
		session.role = decoded.role;
	}

	await session.save();
}

export async function destroySession() {
	const session = await _getSession();
	session.destroy();
}

export async function getSession(): Promise<IronSession<SessionData>> {
	const session = await _getSession();

	// plain object for the client
	return JSON.parse(JSON.stringify(session));
}
