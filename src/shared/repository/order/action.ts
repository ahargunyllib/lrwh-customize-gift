"use server";

import { db } from "@/server/db";
import { tryCatch } from "../../lib/try-catch";
import type { Order } from "../../types";
import type { GetOrdersQuery } from "./dto";

export const getOrders = async (query: GetOrdersQuery) => {
	let queryBuilder = `
    select *
    from orders
  `;
	const args = [];

	if (query?.search) {
		queryBuilder += ` where order_number ilike $${args.length + 1} or username ilike $${args.length + 1}`;
		args.push(`%${query.search}%`);
	}

	if (query?.page && query?.limit) {
		if (query.page < 1) {
			query.page = 1;
		}

		if (query.limit < 1) {
			query.limit = 10;
		}

		const offset = (query.page - 1) * query.limit;
		queryBuilder += ` limit $${args.length + 1} offset $${args.length + 2}`;
		args.push(query.limit, offset);
	}

	const { data, error } = await tryCatch(db.execute<Order>(queryBuilder));
	if (error) {
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
