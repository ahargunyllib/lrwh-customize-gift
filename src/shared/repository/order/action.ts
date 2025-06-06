"use server";

import { db } from "@/server/db";
import { ordersTable } from "@/server/db/schema/orders";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { tryCatch } from "../../lib/try-catch";
import type {
	CreateOrderRequest,
	GetOrderByUsernameAndOrderNumberQuery,
	GetOrdersQuery,
	UpdateOrderParams,
	UpdateOrderRequest,
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

export const getOrderByUsernameAndOrderNumber = async (
	query: GetOrderByUsernameAndOrderNumberQuery,
) => {
	const { data: orders, error } = await tryCatch(
		db
			.select()
			.from(ordersTable)
			.where(
				and(
					eq(ordersTable.username, query.username),
					eq(ordersTable.orderNumber, query.orderNumber),
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

	return {
		success: true,
		data: {
			orders,
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
