import { z } from "zod";
import type { Pagination, Product, ProductVariant } from "../../types";

export type GetProductsQuery = {
	search?: string;
	page?: number;
	limit?: number;
};

export type GetProductsResponse = {
	products: (Product & {
		variants: ProductVariant[];
	})[];
	meta: {
		pagination: Pagination;
	};
};

export const createProductSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	shopeeUrl: z.string().url("Invalid URL").optional(),
});

export type CreateProductRequest = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
	name: z.string().min(1, "Name is required").optional(),
	description: z.string().optional(),
	shopeeUrl: z.string().url("Invalid URL").optional(),
});

export type UpdateProductRequest = z.infer<typeof updateProductSchema>;

export type UpdateProductParams = {
	id: Product["id"];
};

export type DeleteProductParams = {
	id: Product["id"];
};

export const createProductVariantSchema = z.object({
	name: z.string().min(1, "Variant name is required"),
	description: z.string().optional(),
	width: z.coerce
		.number()
		.positive()
		.min(1, "Width must be a positive integer"),
	height: z.coerce
		.number()
		.positive()
		.min(1, "Height must be a positive integer"),
});

export type CreateProductVariantRequest = z.infer<
	typeof createProductVariantSchema
>;

export type CreateProductVariantParams = {
	productId: Product["id"];
};

export const updateProductVariantSchema = z.object({
	name: z.string().min(1, "Variant name is required").optional(),
	description: z.string().optional(),
	width: z.coerce
		.number()
		.int()
		.min(0, "Width must be a non-negative integer")
		.optional(),
	height: z.coerce
		.number()
		.int()
		.min(0, "Height must be a non-negative integer")
		.optional(),
});

export type UpdateProductVariantRequest = z.infer<
	typeof updateProductVariantSchema
>;

export type UpdateProductVariantParams = {
	productId: Product["id"];
	variantId: ProductVariant["id"];
};

export type DeleteProductVariantParams = {
	productId: Product["id"];
	variantId: ProductVariant["id"];
};
