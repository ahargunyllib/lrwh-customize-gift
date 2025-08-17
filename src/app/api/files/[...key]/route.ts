import { getObjectStream } from "@/server/s3";
import { tryCatch } from "@/shared/lib/try-catch";

export async function GET(
	_: Request,
	{ params }: { params: Promise<{ key: string[] }> },
) {
	const paramsValue = await params;

	const key = paramsValue.key.join("/");

	const { data: res, error } = await tryCatch(getObjectStream(key));
	if (error) {
		console.error(error);
		return new Response(error.message || "Not Found", { status: 404 });
	}

	if (!res) {
		return new Response("Not Found", { status: 404 });
	}

	if (!res.success) {
		return new Response("No data found", { status: 404 });
	}

	if (!res.data) {
		return new Response("No data found", { status: 404 });
	}

	if (!res.data.stream) {
		return new Response("No stream found", { status: 404 });
	}

	const webStream = res.data.stream;
	return new Response(webStream, {
		status: 200,
		headers: {
			"Content-Type": "image/png",
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
}
