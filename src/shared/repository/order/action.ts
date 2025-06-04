"use server";

import { db } from "@/server/db";
import { ordersTable } from "@/server/db/schema/orders";
import { desc, ilike, or } from "drizzle-orm";
import { tryCatch } from "../../lib/try-catch";
import type { GetOrdersQuery } from "./dto";

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
