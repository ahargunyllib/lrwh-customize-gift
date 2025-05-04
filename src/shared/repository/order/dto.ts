import { z } from "zod";
import type { Order } from "../../types";

export type GetOrdersQuery = {
	search?: string;
	page?: number;
	limit?: number;
};

export const createOrderSchema = z.object({
	orderNumber: z.string().min(1, "Order number is required"),
	username: z.string().min(1, "Username is required"),
});

export type CreateOrderRequest = z.infer<typeof createOrderSchema>;

export const updateOrderSchema = z.object({
	orderNumber: z.string().min(1, "Order number is required"),
	username: z.string().min(1, "Username is required"),
});

export type UpdateOrderRequest = z.infer<typeof updateOrderSchema>;

export type UpdateOrderParams = {
	id: Order["id"];
};

export type DeleteOrderParams = {
	id: Order["id"];
};
