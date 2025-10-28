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

export const config = {
	matcher: [
		"/",
		"/editor/:path*",
		"/design-system",
		"/api/:path*",
		"/dashboard/:path*",
	],
};
