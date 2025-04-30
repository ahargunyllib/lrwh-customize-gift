import { type NextRequest, NextResponse } from "next/server";
import { authGuard } from "./middlewares/auth-guard";
import { devOnlyGuard } from "./middlewares/dev-only-guard";
import { redirectRules } from "./middlewares/redirect-rules-guard";
import { roleBasedAccess } from "./middlewares/role-access-guard";
import { getSession } from "./shared/repository/session-manager/action";
import type {
	MiddlewareContext,
	MiddlewareFunction,
} from "./shared/types/middleware";

export async function middleware(req: NextRequest) {
	return runMiddleware(req, [
		devOnlyGuard,
		authGuard,
		redirectRules,
		roleBasedAccess,
	]);
}

export const config = {
	matcher: ["/dashboard/:path*", "/design-system"],
};

export const PROTECTED_ROUTES = ["/dashboard"];

export const DEV_ONLY_ROUTES = ["/design-system"];

export const ROUTE_REDIRECTS = {
	"/dashboard": "/dashboard/profile",
} as const;

async function runMiddleware(
	req: NextRequest,
	middlewares: MiddlewareFunction[],
): Promise<NextResponse> {
	const session = await getSession();
	const context: MiddlewareContext = { req, session };

	for (const middleware of middlewares) {
		const result = await middleware(context);
		if (result) return result;
	}

	return NextResponse.next();
}
