import { tabsData } from "@/features/dashboard/data/tabs";
import type { MiddlewareFunction } from "@/shared/types/middleware";
import { NextResponse } from "next/server";

export const roleBasedAccess: MiddlewareFunction = async ({ req, session }) => {
	const pathname = req.nextUrl.pathname;

	if (!session?.isLoggedIn) {
		const returnTo = `${pathname}${req.nextUrl.search}`;
		const response = NextResponse.redirect(new URL("/login", req.nextUrl));
		response.cookies.set("returnTo", returnTo, {
			path: "/",
			secure: process.env.NODE_ENV === "production",
		});
		return response;
	}

	if (
		session?.role &&
		pathname.startsWith("/dashboard") &&
		tabsData[session.role].every((tab) => !pathname.startsWith(tab.href))
	) {
		return NextResponse.redirect(new URL("/dashboard/profile", req.nextUrl));
	}
};
