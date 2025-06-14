"use server";

import { db } from "@/server/db";
import { ordersTable } from "@/server/db/schema/orders";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { uploadFileToS3 } from "../../../server/s3";
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
			.select()
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

	return {
		success: true,
		data: {
			order,
		},
		message: "Order fetched successfully",
	};
};

export const createOrder = async ({
	orderNumber,
	username,
}: CreateOrderRequest) => {
	const { error } = await tryCatch(
		db.insert(ordersTable).values({
			orderNumber,
			username,
		}),
	);
	if (error) {
		console.error(error);
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
	{ orderNumber, username }: UpdateOrderRequest,
) => {
	const { error } = await tryCatch(
		db
			.update(ordersTable)
			.set({
				orderNumber,
				username,
			})
			.where(eq(ordersTable.id, id)),
	);
	if (error) {
		console.error(error);
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
		db.delete(ordersTable).where(eq(ordersTable.id, id)),
	);
	if (error) {
		console.error(error);
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
