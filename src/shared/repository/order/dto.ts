import { z } from "zod";
import type { Order } from "../../types";

export type GetOrdersQuery = {
	search?: string;
	page?: number;
	limit?: number;
};

export const VerifyOrderByUsernameAndOrderNumberSchema = z.object({
	username: z.string().min(1, "Username is required"),
	orderNumber: z.string().min(1, "Order number is required"),
});

export type VerifyOrderByUsernameAndOrderNumberRequest = z.infer<
	typeof VerifyOrderByUsernameAndOrderNumberSchema
>;

export type VerifyOrderByUsernameAndOrderNumberResponse = {
	order: Order;
};

export const createOrderSchema = z.object({
	orderNumber: z.string().min(1, "Order number is required"),
	username: z.string().min(1, "Username is required"),
	productVariantIds: z
		.array(z.string().uuid("Invalid product variant ID format"))
		.min(1, "At least one product variant ID is required"),
});

export type CreateOrderRequest = z.infer<typeof createOrderSchema>;

export const updateOrderSchema = z.object({
	orderNumber: z.string().min(1, "Order number is required"),
	username: z.string().min(1, "Username is required"),
	productVariantIds: z
		.array(z.string().uuid("Invalid product variant ID format"))
		.min(1, "At least one product variant ID is required"),
});

export type UpdateOrderRequest = z.infer<typeof updateOrderSchema>;

export type UpdateOrderParams = {
	id: Order["id"];
};

export type DeleteOrderParams = {
	id: Order["id"];
};

export const submitOrderSchema = z.object({
	file: z.instanceof(Blob).refine((file) => file.size > 0, "File is required"),
	orderId: z.string().uuid("Invalid order ID format"),
});

export type SubmitOrderRequest = z.infer<typeof submitOrderSchema>;
