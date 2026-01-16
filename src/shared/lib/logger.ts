import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

// Determine environment
const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = !isProduction;

// Log level based on environment
const logLevel = isProduction ? "info" : "debug";

/**
 * Custom format for console output (human-readable)
 */
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
	const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : "";
	return `${timestamp} [${level}]: ${message} ${metaStr}`;
});

/**
 * File transport with daily rotation AND size-based rotation
 * - Rotate daily
 * - Rotate when file reaches 10MB
 * - Keep logs for 14 days
 */
const fileRotateTransport = new DailyRotateFile({
	filename: "logs/app-%DATE%.log",
	datePattern: "YYYY-MM-DD",
	maxSize: "10m",
	maxFiles: "14d",
	format: combine(
		timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
		errors({ stack: true }),
		json(),
	),
	level: logLevel,
});

/**
 * Error-specific file transport
 */
const errorFileTransport = new DailyRotateFile({
	filename: "logs/error-%DATE%.log",
	datePattern: "YYYY-MM-DD",
	maxSize: "10m",
	maxFiles: "14d",
	level: "error",
	format: combine(
		timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
		errors({ stack: true }),
		json(),
	),
});

/**
 * Console transport (colorized for development)
 */
const consoleTransport = new winston.transports.Console({
	format: isDevelopment
		? combine(
				colorize(),
				timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
				errors({ stack: true }),
				consoleFormat,
			)
		: combine(
				timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
				errors({ stack: true }),
				json(),
			),
	level: logLevel,
});

/**
 * Winston logger instance
 */
const logger = winston.createLogger({
	level: logLevel,
	defaultMeta: {
		service: "lrwh-customize-gift",
		environment: process.env.NODE_ENV || "development",
	},
	transports: [consoleTransport, fileRotateTransport, errorFileTransport],
	exitOnError: false,
});

/**
 * Operation metadata interface
 */
export interface OperationContext {
	operation: string;
	entityId?: string;
	userId?: number | string;
	duration?: number;
	success: boolean;
	error?: string;
	errorStack?: string;
	data?: Record<string, unknown>;
}

/**
 * Log a complete operation with full context
 * Following loggingsucks.com principle: "One wide event per operation"
 *
 * @example
 * ```ts
 * const startTime = Date.now();
 * const baseContext = {
 *   operation: "order.create",
 *   userId: session.userId,
 * };
 *
 * try {
 *   // ... operation logic
 *   logOperation({
 *     ...baseContext,
 *     entityId: orderId,
 *     success: true,
 *     duration: Date.now() - startTime,
 *     data: { orderNumber, username }
 *   });
 * } catch (error) {
 *   logOperation({
 *     ...baseContext,
 *     success: false,
 *     error: error.message,
 *     errorStack: error.stack,
 *     duration: Date.now() - startTime,
 *     data: { orderNumber, username }
 *   });
 * }
 * ```
 */
export function logOperation(context: OperationContext): void {
	const level = context.success ? "info" : "error";
	const message = `${context.operation} ${context.success ? "succeeded" : "failed"}`;

	logger.log(level, message, {
		...context,
		timestamp: new Date().toISOString(),
	});
}

/**
 * Sanitize sensitive data from logs
 */
export function sanitize<T extends Record<string, unknown>>(
	data: T,
	keysToRedact: string[] = ["password", "token", "secret", "apiKey"],
): T {
	const sanitized = { ...data } as Record<string, unknown>;
	for (const key of keysToRedact) {
		if (key in sanitized) {
			sanitized[key] = "[REDACTED]";
		}
	}
	return sanitized as T;
}

/**
 * Create a child logger with additional default metadata
 */
export function createChildLogger(
	defaultMeta: Record<string, unknown>,
): winston.Logger {
	return logger.child(defaultMeta);
}

// Export the logger instance and individual methods
export { logger };
export default logger;
