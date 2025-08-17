import crypto from "node:crypto";

// Data URL regex: data:[<mime>][;base64],<payload>
export function parseDataUrl(dataUrl: string) {
	const match = /^data:([^;,]+);base64,(.+)$/i.exec(dataUrl.trim());
	if (!match) {
		throw new Error("Invalid Data URL format");
	}
	const [, mime, base64] = match;
	return { mime: mime.toLowerCase(), base64 };
}

// PNG magic byte check
export function looksLikePng(buf: Buffer) {
	const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	return buf.subarray(0, 8).equals(sig);
}

// SHA256 hash for deterministic keys
export function sha256(buf: Buffer) {
	return crypto.createHash("sha256").update(buf).digest("hex");
}

// Convert base64 to Uint8Array (Edge-safe alternative to Buffer)
export function base64ToUint8Array(b64: string) {
	const bin = atob(b64);
	const len = bin.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
	return bytes;
}

// Maximum allowed decoded size (default: 8 MB)
export const MAX_BYTES = 8 * 1024 * 1024;
