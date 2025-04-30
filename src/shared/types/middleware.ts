import type { NextRequest, NextResponse } from "next/server";
import type { getSession } from "../repository/session-manager/action";

export type MiddlewareContext = {
	req: NextRequest;
	session: Awaited<ReturnType<typeof getSession>> | null;
};

export type MiddlewareFunction = (
	context: MiddlewareContext,
) => Promise<NextResponse | undefined>;
