"use server";

import { db } from "@/server/db";
import {
	orderProductVariantsTable,
	ordersTable,
} from "@/server/db/schema/orders";
import {
	productVariantsTable,
	productsTable,
} from "@/server/db/schema/products";
import { uploadBufferToS3 } from "@/server/s3";
import type { Pagination } from "@/shared/types";
import { and, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import {
	MAX_BYTES,
	looksLikePng,
	parseDataUrl,
	sha256,
} from "../../lib/data-url";
import { logOperation } from "../../lib/logger";
import { tryCatch } from "../../lib/try-catch";
import type { ApiResponse } from "../../types";
import { createAuditLog } from "../audit-log/action";
import { getSession } from "../session-manager/action";
import type {
	CreateOrderRequest,
	GetOrdersQuery,
	GetOrdersResponse,
	SubmitOrderRequest,
	UpdateOrderParams,
	UpdateOrderRequest,
	VerifyOrderByUsernameAndOrderNumberRequest,
	VerifyOrderByUsernameAndOrderNumberResponse,
} from "./dto";

export const getOrders = async (
	query: GetOrdersQuery,
): Promise<ApiResponse<GetOrdersResponse>> => {
	// Build filter array conditionally to avoid passing undefined to and()
	const filters = [];
	if (query.search) {
		filters.push(
			or(
				ilike(ordersTable.orderNumber, `%${query.search}%`),
				ilike(ordersTable.username, `%${query.search}%`),
			),
		);
	}
	if (query.status && query.status !== "all") {
		filters.push(eq(ordersTable.status, query.status));
	}

	const { data: orders, error } = await tryCatch(
		db
			.select()
			.from(ordersTable)
			.where(filters.length > 0 ? and(...filters) : undefined)
			.orderBy(
				query.sortBy
					? query.sortOrder === "asc"
						? ordersTable[query.sortBy]
						: desc(ordersTable[query.sortBy])
					: desc(ordersTable.createdAt),
			)
			.limit(query.limit || 10)
			.offset(((query.page || 1) - 1) * (query.limit || 10)),
	);
	if (error) {
		return {
			success: false,
			error: error.message,
			message: "Failed to fetch orders",
		};
	}

	const { data: meta, error: countErr } = await tryCatch(
		db
			.select({ count: count(ordersTable.id) })
			.from(ordersTable)
			.where(filters.length > 0 ? and(...filters) : undefined),
	);
	if (countErr) {
		return {
			success: false,
			error: countErr.message,
			message: "Failed to count products",
		};
	}

	const orderIds = orders.map((order) => order.id);
	const { data: orderProductVariants, error: fetchOrderProductVariantsErr } =
		await tryCatch(
			db
				.select()
				.from(orderProductVariantsTable)
				.where(inArray(orderProductVariantsTable.orderId, orderIds)),
		);
	if (fetchOrderProductVariantsErr) {
		return {
			success: false,
			error: fetchOrderProductVariantsErr.message,
			message: "Failed to fetch order product variants",
		};
	}
	const productVariantIds = orderProductVariants.map(
		(variant) => variant.productVariantId,
	);
	const { data: productVariants, error: fetchProductVariantsErr } =
		await tryCatch(
			db
				.select({
					id: productVariantsTable.id,
					name: productVariantsTable.name,
					product: {
						id: productsTable.id,
						name: productsTable.name,
					},
					width: productVariantsTable.width,
					height: productVariantsTable.height,
				})
				.from(productVariantsTable)
				.innerJoin(
					productsTable,
					eq(productVariantsTable.productId, productsTable.id),
				)
				.where(inArray(productVariantsTable.id, productVariantIds)),
		);
	if (fetchProductVariantsErr) {
		return {
			success: false,
			error: fetchProductVariantsErr.message,
			message: "Failed to fetch product variants",
		};
	}

	const orderRes: GetOrdersResponse["orders"] = orders.map((order) => {
		const variants = orderProductVariants
			.filter((opv) => opv.orderId === order.id)
			.map((opv) => {
				const variant = productVariants.find(
					(pv) => pv.id === opv.productVariantId,
				);

				return {
					id: variant?.id ?? "",
					name: variant?.name ?? "",
					width: variant?.width ?? 0,
					height: variant?.height ?? 0,
					product: {
						id: variant?.product.id ?? "",
						name: variant?.product.name ?? "",
					},
					imageUrl: opv.imageUrl || null,
				};
			});

		return {
			id: order.id,
			orderNumber: order.orderNumber,
			username: order.username,
			createdAt: order.createdAt,
			products: variants.map((variant) => ({
				id: variant.product.id,
				name: variant.product.name,
				productVariant: {
					id: variant.id,
					name: variant.name,
					width: variant.width,
					height: variant.height,
				},
				imageUrl: variant.imageUrl,
			})),
		};
	});

	const pagination: Pagination = {
		total_data: meta[0].count,
		total_page: Math.ceil(meta[0].count / (query.limit || 10)),
		page: query.page || 1,
		limit: query.limit || 10,
	};

	return {
		success: true,
		data: {
			orders: orderRes,
			meta: {
				pagination,
			},
		},
		message: "Orders fetched successfully",
	};
};

export const verifyOrderByUsernameAndOrderNumber = async (
	req: VerifyOrderByUsernameAndOrderNumberRequest,
): Promise<ApiResponse<VerifyOrderByUsernameAndOrderNumberResponse>> => {
	const { data: orders, error } = await tryCatch(
		db
			.select({
				id: ordersTable.id,
				username: ordersTable.username,
				orderNumber: ordersTable.orderNumber,
			})
			.from(ordersTable)
			.where(
				and(
					eq(ordersTable.username, req.username),
					eq(ordersTable.orderNumber, req.orderNumber),
				),
			),
	);
	if (error) {
		return {
			success: false,
			error: error.message,
			message: "Failed to fetch order",
		};
	}

	if (orders.length === 0) {
		return {
			success: false,
			error: "Order not found",
			message: "Order not found",
		};
	}

	const order = orders[0];

	const { data: orderProductVariants, error: fetchOrderProductVariantsErr } =
		await tryCatch(
			db
				.select()
				.from(orderProductVariantsTable)
				.where(eq(orderProductVariantsTable.orderId, order.id)),
		);
	if (fetchOrderProductVariantsErr) {
		return {
			success: false,
			error: fetchOrderProductVariantsErr.message,
			message: "Failed to fetch order product variants",
		};
	}

	const productVariantIds = orderProductVariants.map(
		(variant) => variant.productVariantId,
	);

	const { data: productVariants, error: fetchProductVariantsErr } =
		await tryCatch(
			db
				.select({
					id: productVariantsTable.id,
					name: productVariantsTable.name,
					product: {
						id: productsTable.id,
						name: productsTable.name,
					},
				})
				.from(productVariantsTable)
				.innerJoin(
					productsTable,
					eq(productVariantsTable.productId, productsTable.id),
				)
				.where(inArray(productVariantsTable.id, productVariantIds)),
		);
	if (fetchProductVariantsErr) {
		return {
			success: false,
			error: fetchProductVariantsErr.message,
			message: "Failed to fetch product variants",
		};
	}

	const orderRes: VerifyOrderByUsernameAndOrderNumberResponse["order"] = {
		...order,
		productVariants: productVariants.map((variant) => ({
			...variant,
			templates: orderProductVariants
				.filter((opv) => opv.productVariantId === variant.id)
				.map((opv) => ({
					id: opv.id,
					dataURL: null, // Assuming dataURL is not needed here, adjust if necessary
				})),
		})),
	};

	return {
		success: true,
		data: {
			order: orderRes,
		},
		message: "Order fetched successfully",
	};
};

export const createOrder = async ({
	orderNumber,
	username,
	productVariants,
}: CreateOrderRequest) => {
	const startTime = Date.now();
	const session = await getSession();

	const baseContext = {
		operation: "order.create",
		userId: session.isLoggedIn ? Number(session.userId) : undefined,
	};

	if (!session.isLoggedIn) {
		logOperation({
			...baseContext,
			success: false,
			error: "Unauthorized",
			duration: Date.now() - startTime,
		});
		return { success: false, error: "Unauthorized", message: "Unauthorized" };
	}

	let createdOrderId: string | null = null;

	const { error } = await tryCatch(
		db.transaction(async (tx) => {
			const { data: createdOrder, error } = await tryCatch(
				tx
					.insert(ordersTable)
					.values({
						orderNumber,
						username,
					})
					.returning({
						id: ordersTable.id,
					}),
			);
			if (error) {
				tx.rollback();
				return;
			}

			createdOrderId = createdOrder[0].id;

			const { error: fetchError } = await tryCatch(
				tx.insert(orderProductVariantsTable).values(
					productVariants.flatMap(({ productVariantId, quantity }) =>
						Array.from({ length: quantity }, () => ({
							orderId: createdOrder[0].id,
							productVariantId,
						})),
					),
				),
			);
			if (fetchError) {
				tx.rollback();
				return;
			}
		}),
	);
	if (error) {
		logOperation({
			...baseContext,
			success: false,
			error: error.message,
			errorStack: error.stack,
			duration: Date.now() - startTime,
		});
		return {
			success: false,
			error: error.message,
			message: "Failed to create order",
		};
	}

	if (createdOrderId) {
		// Fire-and-forget: don't block main operation
		createAuditLog({
			userId: Number(session.userId),
			action: "CREATE",
			entityType: "order",
			entityId: createdOrderId,
			entityName: orderNumber,
			details: { orderNumber, username, productVariants },
		});
	}

	logOperation({
		...baseContext,
		entityId: createdOrderId ?? undefined,
		success: true,
		duration: Date.now() - startTime,
	});

	return {
		success: true,
		data: null,
		message: "Order created successfully",
	};
};

export const updateOrder = async (
	{ id }: UpdateOrderParams,
	{ orderNumber, username, productVariants }: UpdateOrderRequest,
) => {
	const startTime = Date.now();
	const session = await getSession();

	const baseContext = {
		operation: "order.update",
		entityId: id,
		userId: session.isLoggedIn ? Number(session.userId) : undefined,
	};

	if (!session.isLoggedIn) {
		logOperation({
			...baseContext,
			success: false,
			error: "Unauthorized",
			duration: Date.now() - startTime,
		});
		return { success: false, error: "Unauthorized", message: "Unauthorized" };
	}

	const { data: existingOrder, error: fetchError } = await tryCatch(
		db.select().from(ordersTable).where(eq(ordersTable.id, id)),
	);
	if (fetchError) {
		logOperation({
			...baseContext,
			success: false,
			error: fetchError.message,
			errorStack: fetchError.stack,
			duration: Date.now() - startTime,
		});
		return {
			success: false,
			error: fetchError.message,
			message: "Failed to fetch existing order",
		};
	}

	if (existingOrder.length === 0) {
		logOperation({
			...baseContext,
			success: false,
			error: "Order not found",
			duration: Date.now() - startTime,
		});
		return {
			success: false,
			error: "Order not found",
			message: "Order not found",
		};
	}

	const { error } = await tryCatch(
		db.transaction(async (tx) => {
			const { error: updateError } = await tryCatch(
				tx
					.update(ordersTable)
					.set({
						orderNumber,
						username,
					})
					.where(eq(ordersTable.id, id)),
			);
			if (updateError) {
				tx.rollback();
				return;
			}

			const { error: deleteError } = await tryCatch(
				tx
					.delete(orderProductVariantsTable)
					.where(eq(orderProductVariantsTable.orderId, id)),
			);
			if (deleteError) {
				tx.rollback();
				return;
			}

			const { error: insertError } = await tryCatch(
				tx.insert(orderProductVariantsTable).values(
					productVariants.flatMap(({ productVariantId, quantity }) =>
						Array.from({ length: quantity }, () => ({
							orderId: id,
							productVariantId,
						})),
					),
				),
			);
			if (insertError) {
				tx.rollback();
				return;
			}
		}),
	);
	if (error) {
		logOperation({
			...baseContext,
			success: false,
			error: error.message,
			errorStack: error.stack,
			duration: Date.now() - startTime,
		});
		return {
			success: false,
			error: error.message,
			message: "Failed to update order",
		};
	}

	// Fire-and-forget: don't block main operation
	createAuditLog({
		userId: Number(session.userId),
		action: "UPDATE",
		entityType: "order",
		entityId: id,
		entityName: orderNumber,
		details: { orderNumber, username, productVariants },
	});

	logOperation({
		...baseContext,
		success: true,
		duration: Date.now() - startTime,
	});

	return {
		success: true,
		data: null,
		message: "Order updated successfully",
	};
};

export const deleteOrder = async ({ id }: UpdateOrderParams) => {
	const startTime = Date.now();
	const session = await getSession();

	const baseContext = {
		operation: "order.delete",
		entityId: id,
		userId: session.isLoggedIn ? Number(session.userId) : undefined,
	};

	if (!session.isLoggedIn) {
		logOperation({
			...baseContext,
			success: false,
			error: "Unauthorized",
			duration: Date.now() - startTime,
		});
		return { success: false, error: "Unauthorized", message: "Unauthorized" };
	}

	// Get order details before deleting
	const { data: order } = await tryCatch(
		db
			.select({ orderNumber: ordersTable.orderNumber })
			.from(ordersTable)
			.where(eq(ordersTable.id, id)),
	);

	const { error } = await tryCatch(
		db.transaction(async (tx) => {
			const { error: deleteError } = await tryCatch(
				tx
					.delete(orderProductVariantsTable)
					.where(eq(orderProductVariantsTable.orderId, id)),
			);
			if (deleteError) {
				tx.rollback();
				return;
			}
			const { error: orderDeleteError } = await tryCatch(
				tx.delete(ordersTable).where(eq(ordersTable.id, id)),
			);
			if (orderDeleteError) {
				tx.rollback();
				return;
			}
		}),
	);
	if (error) {
		logOperation({
			...baseContext,
			success: false,
			error: error.message,
			errorStack: error.stack,
			duration: Date.now() - startTime,
		});
		return {
			success: false,
			error: error.message,
			message: "Failed to delete order",
		};
	}

	// Fire-and-forget: don't block main operation
	createAuditLog({
		userId: Number(session.userId),
		action: "DELETE",
		entityType: "order",
		entityId: id,
		entityName: order?.[0]?.orderNumber,
	});

	logOperation({
		...baseContext,
		success: true,
		duration: Date.now() - startTime,
	});

	return {
		success: true,
		data: null,
		message: "Order deleted successfully",
	};
};

export const submitOrder = async (req: SubmitOrderRequest) => {
	const startTime = Date.now();
	const { orderId, templates } = req;

	const baseContext = {
		operation: "order.submit",
		entityId: orderId,
	};

	const { data: orderExists, error: orderFetchErr } = await tryCatch(
		db.select().from(ordersTable).where(eq(ordersTable.id, orderId)),
	);
	if (orderFetchErr) {
		logOperation({
			...baseContext,
			success: false,
			error: orderFetchErr.message,
			errorStack: orderFetchErr.stack,
			duration: Date.now() - startTime,
		});
		return {
			success: false,
			error: orderFetchErr.message,
			message: "Failed to fetch order",
		};
	}
	if (orderExists.length === 0) {
		logOperation({
			...baseContext,
			success: false,
			error: "Order not found",
			duration: Date.now() - startTime,
		});
		return {
			success: false,
			error: "Order not found",
			message: "Order not found",
		};
	}

	// 1) Decode & validate all templates
	const decoded = await Promise.all(
		templates.map(async (t) => {
			// cant submit if already has image
			const { data: existing, error: fetchErr } = await tryCatch(
				db
					.select()
					.from(orderProductVariantsTable)
					.where(
						and(
							eq(orderProductVariantsTable.id, t.orderProductVariantId),
							eq(orderProductVariantsTable.orderId, orderId),
						),
					),
			);
			if (fetchErr) {
				return {
					success: false as const,
					orderProductVariantId: t.orderProductVariantId,
					error: fetchErr.message,
					message: "Failed to fetch existing variant",
				};
			}
			if (existing.length === 0) {
				return {
					success: false as const,
					orderProductVariantId: t.orderProductVariantId,
					error: "Variant not found",
					message: "Variant not found",
				};
			}
			if (existing[0].imageUrl) {
				return {
					success: false as const,
					orderProductVariantId: t.orderProductVariantId,
					error: "Image already submitted",
					message: "Image already submitted",
				};
			}

			const { data: parsed, error: parseErr } = await tryCatch(
				Promise.resolve(parseDataUrl(t.dataURL)),
			);
			if (parseErr || !parsed) {
				return {
					success: false as const,
					orderProductVariantId: t.orderProductVariantId,
					error: parseErr?.message ?? "Invalid Data URL",
					message: "Failed to parse Data URL",
				};
			}

			const { mime, base64 } = parsed;
			const approxDecodedBytes = Buffer.byteLength(base64, "base64");
			if (approxDecodedBytes > MAX_BYTES) {
				return {
					success: false as const,
					orderProductVariantId: t.orderProductVariantId,
					error: `Data URL exceeds ${MAX_BYTES} bytes`,
					message: "Data URL too large",
				};
			}

			const buf = Buffer.from(base64, "base64");
			if (mime !== "image/png" || !looksLikePng(buf)) {
				return {
					success: false as const,
					orderProductVariantId: t.orderProductVariantId,
					error: "Expected PNG format",
					message: "Invalid file format",
				};
			}

			const hash = sha256(buf);
			const key = `${orderExists[0].username}_${orderExists[0].orderNumber}_${hash}.png`;

			return {
				success: true as const,
				data: {
					orderProductVariantId: t.orderProductVariantId,
					mime,
					buf,
					key,
					hash,
				},
			};
		}),
	);

	// Early exit if any decode failed
	const decodeErrors = decoded.filter((d) => !d.success);
	if (decodeErrors.length > 0) {
		return {
			success: false,
			error: "Some images failed validation",
			message: decodeErrors
				.map((e) => `${e.orderProductVariantId}: ${e.error}`)
				.join("; "),
		};
	}

	const validItems = decoded.filter((d) => d.success).map((d) => d.data);

	// 2) Upload in parallel
	const uploadResults = await Promise.all(
		validItems.map(async ({ buf, key, mime }) => {
			const { data: uploadRes, error: uploadErr } = await tryCatch(
				uploadBufferToS3(buf, key, mime),
			);

			if (uploadErr) {
				return {
					success: false as const,
					key,
					error: uploadErr.message,
					message: "Failed to upload file",
				};
			}
			if (!uploadRes.success) {
				return {
					success: false as const,
					key,
					error: uploadRes.error ?? "Unknown upload error",
					message: uploadRes.message ?? "Upload failed",
				};
			}
			return {
				success: true as const,
				key,
				fileUrl: uploadRes.data?.fileUrl,
			};
		}),
	);

	const failedUploads = uploadResults.filter((u) => !u.success);
	if (failedUploads.length > 0) {
		return {
			success: false,
			error: "Some uploads failed",
			message: failedUploads.map((u) => `${u.key}: ${u.error}`).join("; "),
		};
	}

	const keyToUrl = new Map<string, string>();
	for (const u of uploadResults) {
		if (u.success && u.fileUrl) keyToUrl.set(u.key, u.fileUrl);
	}

	// 3) DB updates in a transaction
	const { data: finalStatus, error: txErr } = await tryCatch(
		db.transaction(async (tx) => {
			for (const item of validItems) {
				const fileUrl = keyToUrl.get(item.key);
				if (!fileUrl) {
					tx.rollback();
					return;
				}

				const { error: updateErr } = await tryCatch(
					tx
						.update(orderProductVariantsTable)
						.set({ imageUrl: fileUrl })
						.where(
							and(
								eq(orderProductVariantsTable.orderId, orderId),
								eq(orderProductVariantsTable.id, item.orderProductVariantId),
							),
						),
				);
				if (updateErr) {
					tx.rollback();
					return;
				}
			}

			// 4) Calculate and update order status based on image completion
			const { data: allOrderProducts, error: fetchAllErr } = await tryCatch(
				tx
					.select()
					.from(orderProductVariantsTable)
					.where(eq(orderProductVariantsTable.orderId, orderId)),
			);
			if (fetchAllErr) {
				tx.rollback();
				return;
			}

			const totalProducts = allOrderProducts.length;
			const productsWithImages = allOrderProducts.filter(
				(p) => p.imageUrl,
			).length;

			let newStatus = "progress";
			if (productsWithImages === totalProducts && totalProducts > 0) {
				newStatus = "completed";
			} else if (productsWithImages === 0) {
				newStatus = "no-images";
			}

			const { error: statusUpdateErr } = await tryCatch(
				tx
					.update(ordersTable)
					.set({ status: newStatus })
					.where(eq(ordersTable.id, orderId)),
			);
			if (statusUpdateErr) {
				tx.rollback();
				return;
			}

			const remainingCount = totalProducts - productsWithImages;

			return { status: newStatus, remainingCount };
		}),
	);

	if (txErr) {
		logOperation({
			...baseContext,
			success: false,
			error: txErr.message,
			errorStack: txErr.stack,
			duration: Date.now() - startTime,
		});
		return {
			success: false,
			error: txErr.message,
			message: "Failed to update order with uploaded files",
		};
	}

	logOperation({
		...baseContext,
		success: true,
		duration: Date.now() - startTime,
		data: {
			status: finalStatus?.status,
			remainingCount: finalStatus?.remainingCount,
		},
	});

	return {
		success: true,
		message: "Files uploaded and order updated successfully",
		data: {
			status: finalStatus?.status,
			remainingCount: finalStatus?.remainingCount,
		},
	};
};
