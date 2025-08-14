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
import { uploadFileToS3 } from "@/server/s3";
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { tryCatch } from "../../lib/try-catch";
import type { ApiResponse } from "../../types";
import type {
	CreateOrderRequest,
	GetOrdersQuery,
	SubmitOrderRequest,
	UpdateOrderParams,
	UpdateOrderRequest,
	VerifyOrderByUsernameAndOrderNumberRequest,
	VerifyOrderByUsernameAndOrderNumberResponse,
} from "./dto";

export const getOrders = async (query: GetOrdersQuery) => {
	const { data: orders, error } = await tryCatch(
		db
			.select()
			.from(ordersTable)
			.where(
				query.search
					? or(
							ilike(ordersTable.orderNumber, `%${query.search}%`),
							ilike(ordersTable.username, `%${query.search}%`),
						)
					: undefined,
			)
			.orderBy(desc(ordersTable.createdAt))
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

	return {
		success: true,
		data: {
			orders,
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
	productVariantIds,
}: CreateOrderRequest) => {
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
				console.error(error);
				tx.rollback();
				return;
			}

			const { error: fetchError } = await tryCatch(
				tx.insert(orderProductVariantsTable).values(
					productVariantIds.map((productVariantId) => ({
						orderId: createdOrder[0].id,
						productVariantId,
					})),
				),
			);
			if (fetchError) {
				console.error(fetchError);
				tx.rollback();
				return;
			}
		}),
	);
	if (error) {
		return {
			success: false,
			error: error.message,
			message: "Failed to create order",
		};
	}

	return {
		success: true,
		data: null,
		message: "Order created successfully",
	};
};

export const updateOrder = async (
	{ id }: UpdateOrderParams,
	{ orderNumber, username, productVariantIds }: UpdateOrderRequest,
) => {
	const { data: existingOrder, error: fetchError } = await tryCatch(
		db.select().from(ordersTable).where(eq(ordersTable.id, id)),
	);
	if (fetchError) {
		console.error(fetchError);
		return {
			success: false,
			error: fetchError.message,
			message: "Failed to fetch existing order",
		};
	}

	if (existingOrder.length === 0) {
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
				console.error(updateError);
				tx.rollback();
				return;
			}

			const { error: deleteError } = await tryCatch(
				tx
					.delete(orderProductVariantsTable)
					.where(eq(orderProductVariantsTable.orderId, id)),
			);
			if (deleteError) {
				console.error(deleteError);
				tx.rollback();
				return;
			}

			const { error: insertError } = await tryCatch(
				tx.insert(orderProductVariantsTable).values(
					productVariantIds.map((productVariantId) => ({
						orderId: id,
						productVariantId,
					})),
				),
			);
			if (insertError) {
				console.error(insertError);
				tx.rollback();
				return;
			}
		}),
	);
	if (error) {
		return {
			success: false,
			error: error.message,
			message: "Failed to update order",
		};
	}

	return {
		success: true,
		data: null,
		message: "Order updated successfully",
	};
};

export const deleteOrder = async ({ id }: UpdateOrderParams) => {
	const { error } = await tryCatch(
		db.transaction(async (tx) => {
			const { error: deleteError } = await tryCatch(
				tx
					.delete(orderProductVariantsTable)
					.where(eq(orderProductVariantsTable.orderId, id)),
			);
			if (deleteError) {
				console.error(deleteError);
				tx.rollback();
				return;
			}
			const { error: orderDeleteError } = await tryCatch(
				tx.delete(ordersTable).where(eq(ordersTable.id, id)),
			);
			if (orderDeleteError) {
				console.error(orderDeleteError);
				tx.rollback();
				return;
			}
		}),
	);
	if (error) {
		return {
			success: false,
			error: error.message,
			message: "Failed to delete order",
		};
	}

	return {
		success: true,
		data: null,
		message: "Order deleted successfully",
	};
};

export const submitOrder = async (req: SubmitOrderRequest) => {
	const file = new File([req.file], `order-${req.orderId}-${Date.now()}.png`, {
		type: req.file.type,
	});

	const { data: uploadResult, error: uploadError } = await tryCatch(
		uploadFileToS3(file),
	);
	if (uploadError) {
		return {
			success: false,
			error: uploadError.message,
			message: "Failed to upload file",
		};
	}

	if (!uploadResult.success) {
		return {
			success: false,
			error: uploadResult.error,
			message: "Failed to upload file",
		};
	}

	const { error: orderError } = await tryCatch(
		db
			.update(ordersTable)
			.set({
				imageUrl: uploadResult.data?.fileUrl,
			})
			.where(eq(ordersTable.id, req.orderId)),
	);

	if (orderError) {
		return {
			success: false,
			error: orderError.message,
			message: "Failed to update order with image URL",
		};
	}

	return {
		success: true,
		message: "File uploaded and order updated successfully",
	};
};
