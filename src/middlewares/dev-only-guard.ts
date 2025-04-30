import { DEV_ONLY_ROUTES } from "@/middleware";
import type { MiddlewareFunction } from "@/shared/types/middleware";
import { NextResponse } from "next/server";

export const devOnlyGuard: MiddlewareFunction = async ({ req }) => {
	const pathname = req.nextUrl.pathname;
	const isDevRoute = DEV_ONLY_ROUTES.some((r) => pathname.startsWith(r));

	if (isDevRoute && process.env.NODE_ENV !== "development") {
		return NextResponse.redirect(new URL("/", req.nextUrl));
	}
};
