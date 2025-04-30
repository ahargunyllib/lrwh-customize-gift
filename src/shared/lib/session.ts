import type { SessionOptions } from "iron-session";
import type { roleEnum } from "./enums";
import { env } from "./env";

// 8 hours in milliseconds
const MAX_AGE = 8 * 60 * 60 * 1000;

export type SessionData =
	| {
			isLoggedIn: false;
	  }
	| {
			isLoggedIn: true;
			userId: string;
			role: keyof typeof roleEnum;
	  };

export const defaultSession: SessionData = {
	isLoggedIn: false,
};

export const sessionOptions: SessionOptions = {
	password: env.SESSION_PASSWORD,
	cookieName: "session-cookie",
	cookieOptions: {
		//  allow 1 minute buffer
		maxAge: MAX_AGE - 60 * 1000,
		secure: true,
	},
};
