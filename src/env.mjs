import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	server: {
		SESSION_PASSWORD: z.string().min(32),
		SESSION_SECRET: z.string().min(32),
		SESSION_EXPIRATION_TIME: z.string().min(1),
	},
	client: {
		NEXT_PUBLIC_APP_URL: z.string().min(1),
	},
});
