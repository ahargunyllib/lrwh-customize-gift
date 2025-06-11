import type { MiddlewareFunction } from "@/shared/types";
import { NextResponse } from "next/server";
import { PROTECTED_ROUTES } from "./constant";

export const authGuard: MiddlewareFunction = async ({ req, session }) => {
	const pathname = req.nextUrl.pathname;

	const matchedRoute = PROTECTED_ROUTES.find((route) =>
		pathname.startsWith(route.path),
	);

	const isProtected = !!matchedRoute;
	// const hasRequiredRole =
	//   !matchedRoute?.roles || matchedRoute.roles.includes(session?.role);

	if (isProtected) {
		if (!session?.isLoggedIn) {
			const returnTo = `${pathname}${req.nextUrl.search}`;
			const response = NextResponse.redirect(new URL("/login", req.nextUrl));
			response.cookies.set("returnTo", returnTo, {
				path: "/",
				secure: process.env.NODE_ENV === "production",
			});
			return response;
		}

		// if (!hasRequiredRole) {
		//   return NextResponse.redirect(new URL("/unauthorized", req.nextUrl));
		// }
	}

	return NextResponse.next();
};
