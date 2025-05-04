"use server";

import { db } from "@/server/db";
import { ordersTable } from "@/server/db/schema/orders";
import { eq, sql } from "drizzle-orm";
import { tryCatch } from "../../lib/try-catch";
import type { Order } from "../../types";
import type {
	CreateOrderRequest,
	GetOrdersQuery,
	UpdateOrderParams,
	UpdateOrderRequest,
} from "./dto";

export const getOrders = async (query: GetOrdersQuery) => {
	const queryBuilder = sql`
    select *
    from orders
  `;

	if (query?.search && query.search.length > 0) {
		query.search = `%${query.search}%`;
		queryBuilder.append(
			sql` where "orderNumber" ilike ${query.search} or username ilike ${query.search}`,
		);
	}

	if (query?.page && query?.limit) {
		if (query.page < 1) {
			query.page = 1;
		}

		if (query.limit < 1) {
			query.limit = 10;
		}

		const offset = (query.page - 1) * query.limit;
		queryBuilder.append(sql` limit ${query.limit} offset ${offset}`);
	}

	const { data, error } = await tryCatch(db.execute<Order>(queryBuilder));
	if (error) {
		console.error(error);
		return {
			success: false,
			error: error.message,
			message: "Failed to fetch orders",
		};
	}

	const { rows: orders } = data;

	return {
		success: true,
		data: {
			orders,
		},
		message: "Orders fetched successfully",
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
