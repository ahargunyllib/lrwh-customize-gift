import { PROTECTED_ROUTES } from "@/middleware";
import type { MiddlewareFunction } from "@/shared/types";
import { NextResponse } from "next/server";

export const authGuard: MiddlewareFunction = async ({ req, session }) => {
	const pathname = req.nextUrl.pathname;
	const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));

	if (isProtected && !session?.isLoggedIn) {
		const returnTo = `${pathname}${req.nextUrl.search}`;
		const response = NextResponse.redirect(new URL("/login", req.nextUrl));
		response.cookies.set("returnTo", returnTo, {
			path: "/",
			secure: process.env.NODE_ENV === "production",
		});
		return response;
	}
};
