import type { OrderProductVariant, Pagination } from "@/shared/types";
import { z } from "zod";
import type { Order, Product, ProductVariant } from "../../types";

export type GetOrdersQuery = {
	search?: string;
	page?: number;
	limit?: number;
	sortBy?: "createdAt" | "orderNumber" | "username";
	sortOrder?: "asc" | "desc";
	status?: "all" | "completed" | "progress" | "no-images";
};

export type GetOrdersResponse = {
	orders: {
		id: Order["id"];
		orderNumber: Order["orderNumber"];
		username: Order["username"];
		createdAt: Order["createdAt"];
		products: {
			id: Product["id"];
			name: Product["name"];
			productVariant: {
				id: ProductVariant["id"];
				name: ProductVariant["name"];
				width: ProductVariant["width"];
				height: ProductVariant["height"];
			};
			imageUrl: OrderProductVariant["imageUrl"];
		}[];
	}[];
	meta: {
		pagination: Pagination;
	};
};

export const VerifyOrderByUsernameAndOrderNumberSchema = z.object({
	username: z.string().min(1, "Username is required"),
	orderNumber: z.string().min(1, "Order number is required"),
});

export type VerifyOrderByUsernameAndOrderNumberRequest = z.infer<
	typeof VerifyOrderByUsernameAndOrderNumberSchema
>;

export type VerifyOrderByUsernameAndOrderNumberResponse = {
	order: {
		id: Order["id"];
		username: Order["username"];
		orderNumber: Order["orderNumber"];

		productVariants: {
			id: ProductVariant["id"];
			name: ProductVariant["name"];
			product: {
				id: Product["id"];
				name: Product["name"];
			};
			templates: {
				id: OrderProductVariant["id"];
				dataURL: string | null;
			}[];
		}[];
	};
};

export const createOrderSchema = z.object({
	orderNumber: z.string().min(1, "Order number is required"),
	username: z.string().min(1, "Username is required"),
	productVariants: z
		.array(
			z.object({
				productVariantId: z.string().uuid("Invalid product variant ID format"),
				quantity: z.number().min(1, "Quantity must be at least 1"),
			}),
		)
		.min(1, "At least one product variant is required"),
});

export type CreateOrderRequest = z.infer<typeof createOrderSchema>;

export const updateOrderSchema = z.object({
	orderNumber: z.string().min(1, "Order number is required"),
	username: z.string().min(1, "Username is required"),
	productVariants: z
		.array(
			z.object({
				productVariantId: z.string().uuid("Invalid product variant ID format"),
				quantity: z.number().min(1, "Quantity must be at least 1"),
			}),
		)
		.min(1, "At least one product variant is required"),
});

export type UpdateOrderRequest = z.infer<typeof updateOrderSchema>;

export type UpdateOrderParams = {
	id: Order["id"];
};

export type DeleteOrderParams = {
	id: Order["id"];
};

export const submitOrderSchema = z.object({
	orderId: z.string().uuid("Invalid order ID format"),
	templates: z
		.array(
			z.object({
				orderProductVariantId: z
					.string()
					.uuid("Invalid order product variant ID format"),
				dataURL: z.string().url("Invalid data URL format"),
			}),
		)
		.min(1, "At least one template is required"),
});

export type SubmitOrderRequest = z.infer<typeof submitOrderSchema>;
