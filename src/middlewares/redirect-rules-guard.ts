import { ROUTE_REDIRECTS } from "@/middleware";
import type { MiddlewareFunction } from "@/shared/types/middleware";
import { NextResponse } from "next/server";

export const redirectRules: MiddlewareFunction = async ({ req }) => {
	const pathname = req.nextUrl.pathname;
	const redirectTo = ROUTE_REDIRECTS[pathname as keyof typeof ROUTE_REDIRECTS];

	if (redirectTo) {
		return NextResponse.redirect(new URL(redirectTo, req.nextUrl));
	}
};
