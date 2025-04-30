import * as jose from "jose";
import type { roleEnum } from "./enums";

interface TokenPayload {
	iss: string;
	exp: number;
	user_id: string;
	role: keyof typeof roleEnum;
}

export function decodeToken(token: string): TokenPayload {
	return jose.decodeJwt(token);
}
