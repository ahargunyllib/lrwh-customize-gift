"use server";

import { db } from "@/server/db";
import { and, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import {
	productVariantsTable,
	productsTable,
} from "../../../server/db/schema/products";
import { logOperation } from "../../lib/logger";
import { tryCatch } from "../../lib/try-catch";
import type { ApiResponse, Pagination } from "../../types";
import { createAuditLog } from "../audit-log/action";
import { getSession } from "../session-manager/action";
import type {
	CreateProductRequest,
	CreateProductVariantParams,
	CreateProductVariantRequest,
	DeleteProductParams,
	DeleteProductVariantParams,
	GetProductsQuery,
	GetProductsResponse,
	UpdateProductParams,
	UpdateProductRequest,
	UpdateProductVariantParams,
	UpdateProductVariantRequest,
} from "./dto";

export const getProducts = async (
	query: GetProductsQuery,
): Promise<ApiResponse<GetProductsResponse>> => {
	const { data: products, error: fetchProductsErr } = await tryCatch(
		db
			.select()
			.from(productsTable)
			.where(
				query.search
					? or(
							ilike(productsTable.name, `%${query.search}%`),
							ilike(productsTable.description, `%${query.search}%`),
						)
					: undefined,
			)
			.orderBy(desc(productsTable.createdAt))
			.limit(query.limit || 10)
			.offset(((query.page || 1) - 1) * (query.limit || 10)),
	);
	if (fetchProductsErr) {
		return {
			success: false,
			error: fetchProductsErr.message,
			message: "Failed to fetch products",
		};
	}

	const { data: meta, error: countErr } = await tryCatch(
		db
			.select({ count: count(productsTable.id) })
			.from(productsTable)
			.where(
				query.search
					? or(
							ilike(productsTable.name, `%${query.search}%`),
							ilike(productsTable.description, `%${query.search}%`),
						)
					: undefined,
			),
	);
	if (countErr) {
		return {
			success: false,
			error: countErr.message,
			message: "Failed to count products",
		};
	}

	const productIds = products.map((product) => product.id);

	const { data: productVariants, error: fetchVariantsErr } = await tryCatch(
		db
			.select()
			.from(productVariantsTable)
			.where(inArray(productVariantsTable.productId, productIds)),
	);
	if (fetchVariantsErr) {
		return {
			success: false,
			error: fetchVariantsErr.message,
			message: "Failed to fetch product variants",
		};
	}

	const productsWithVariants = products.map((product) => ({
		...product,
		variants: productVariants.filter(
			(variant) => variant.productId === product.id,
		),
	}));

	const pagination: Pagination = {
		total_data: meta[0].count,
		total_page: Math.ceil(meta[0].count / (query.limit || 10)),
		page: query.page || 1,
		limit: query.limit || 10,
	};

	return {
		success: true,
		data: {
			products: productsWithVariants,
			meta: {
				pagination,
			},
		},
		message: "Products fetched successfully",
	};
};

export const createProduct = async (data: CreateProductRequest) => {
	const startTime = Date.now();
	const session = await getSession();

	const baseContext = {
		operation: "product.create",
		userId: session.isLoggedIn ? Number(session.userId) : undefined,
	};

	if (!session.isLoggedIn) {
		logOperation({
			...baseContext,
			success: false,
			error: "Unauthorized",
			duration: Date.now() - startTime,
		});
		return { success: false, error: "Unauthorized", message: "Unauthorized" };
	}

	const { data: result, error: createErr } = await tryCatch(
		db
			.insert(productsTable)
			.values({
				name: data.name,
				description: data.description,
				shopeeUrl: data.shopeeUrl,
			})
			.returning({ id: productsTable.id }),
	);
	if (createErr) {
		logOperation({
			...baseContext,
			success: false,
			error: createErr.message,
			errorStack: createErr.stack,
			duration: Date.now() - startTime,
		});
		return {
			success: false,
			error: createErr.message,
			message: "Failed to create product",
		};
	}

	// Fire-and-forget: don't block main operation
	createAuditLog({
		userId: Number(session.userId),
		action: "CREATE",
		entityType: "product",
		entityId: result[0].id,
		entityName: data.name,
		details: data,
	});

	logOperation({
		...baseContext,
		entityId: result[0].id,
		success: true,
		duration: Date.now() - startTime,
	});

	return {
		success: true,
		data: null,
		message: "Product created successfully",
	};
};

export const updateProduct = async (
	{ id }: UpdateProductParams,
	data: UpdateProductRequest,
) => {
	const startTime = Date.now();
	const session = await getSession();

	const baseContext = {
		operation: "product.update",
		entityId: id,
		userId: session.isLoggedIn ? Number(session.userId) : undefined,
	};

	if (!session.isLoggedIn) {
		logOperation({
			...baseContext,
			success: false,
			error: "Unauthorized",
			duration: Date.now() - startTime,
		});
		return { success: false, error: "Unauthorized", message: "Unauthorized" };
	}

	const { error: updateErr } = await tryCatch(
		db
			.update(productsTable)
			.set({
				name: data.name,
				description: data.description,
				shopeeUrl: data.shopeeUrl,
			})
			.where(eq(productsTable.id, id)),
	);
	if (updateErr) {
		logOperation({
			...baseContext,
			success: false,
			error: updateErr.message,
			errorStack: updateErr.stack,
			duration: Date.now() - startTime,
		});
		return {
			success: false,
			error: updateErr.message,
			message: "Failed to update product",
		};
	}

	// Fire-and-forget: don't block main operation
	createAuditLog({
		userId: Number(session.userId),
		action: "UPDATE",
		entityType: "product",
		entityId: id,
		entityName: data.name,
		details: data,
	});

	logOperation({
		...baseContext,
		success: true,
		duration: Date.now() - startTime,
	});

	return {
		success: true,
		data: null,
		message: "Product updated successfully",
	};
};

export const deleteProduct = async ({ id }: DeleteProductParams) => {
	const startTime = Date.now();
	const session = await getSession();

	const baseContext = {
		operation: "product.delete",
		entityId: id,
		userId: session.isLoggedIn ? Number(session.userId) : undefined,
	};

	if (!session.isLoggedIn) {
		logOperation({
			...baseContext,
			success: false,
			error: "Unauthorized",
			duration: Date.now() - startTime,
		});
		return { success: false, error: "Unauthorized", message: "Unauthorized" };
	}

	// Get product name before deleting
	const { data: product } = await tryCatch(
		db
			.select({ name: productsTable.name })
			.from(productsTable)
			.where(eq(productsTable.id, id)),
	);

	const { error: deleteErr } = await tryCatch(
		db.delete(productsTable).where(eq(productsTable.id, id)),
	);
	if (deleteErr) {
		logOperation({
			...baseContext,
			success: false,
			error: deleteErr.message,
			errorStack: deleteErr.stack,
			duration: Date.now() - startTime,
		});
		return {
			success: false,
			error: deleteErr.message,
			message: "Failed to delete product",
		};
	}

	// Fire-and-forget: don't block main operation
	createAuditLog({
		userId: Number(session.userId),
		action: "DELETE",
		entityType: "product",
		entityId: id,
		entityName: product?.[0]?.name,
	});

	logOperation({
		...baseContext,
		success: true,
		duration: Date.now() - startTime,
	});

	return {
		success: true,
		data: null,
		message: "Product deleted successfully",
	};
};

export const createProductVariant = async (
	{ productId }: CreateProductVariantParams,
	data: CreateProductVariantRequest,
) => {
	const startTime = Date.now();
	const session = await getSession();

	const baseContext = {
		operation: "productVariant.create",
		userId: session.isLoggedIn ? Number(session.userId) : undefined,
	};

	if (!session.isLoggedIn) {
		logOperation({
			...baseContext,
			success: false,
			error: "Unauthorized",
			duration: Date.now() - startTime,
		});
		return { success: false, error: "Unauthorized", message: "Unauthorized" };
	}

	const { data: result, error: createErr } = await tryCatch(
		db
			.insert(productVariantsTable)
			.values({
				productId,
				name: data.name,
				description: data.description,
				width: data.width,
				height: data.height,
			})
			.returning({ id: productVariantsTable.id }),
	);
	if (createErr) {
		logOperation({
			...baseContext,
			success: false,
			error: createErr.message,
			errorStack: createErr.stack,
			duration: Date.now() - startTime,
		});
		return {
			success: false,
			error: createErr.message,
			message: "Failed to create product variant",
		};
	}

	// Fire-and-forget: don't block main operation
	createAuditLog({
		userId: Number(session.userId),
		action: "CREATE",
		entityType: "product_variant",
		entityId: result[0].id,
		entityName: data.name,
		details: { ...data, productId },
	});

	logOperation({
		...baseContext,
		entityId: result[0].id,
		success: true,
		duration: Date.now() - startTime,
	});

	return {
		success: true,
		data: null,
		message: "Product variant created successfully",
	};
};

export const updateProductVariant = async (
	{ productId, variantId }: UpdateProductVariantParams,
	data: UpdateProductVariantRequest,
) => {
	const startTime = Date.now();
	const session = await getSession();

	const baseContext = {
		operation: "productVariant.update",
		entityId: variantId,
		userId: session.isLoggedIn ? Number(session.userId) : undefined,
	};

	if (!session.isLoggedIn) {
		logOperation({
			...baseContext,
			success: false,
			error: "Unauthorized",
			duration: Date.now() - startTime,
		});
		return { success: false, error: "Unauthorized", message: "Unauthorized" };
	}

	const { error: updateErr } = await tryCatch(
		db
			.update(productVariantsTable)
			.set({
				name: data.name,
				description: data.description,
				width: data.width,
				height: data.height,
			})
			.where(
				and(
					eq(productVariantsTable.productId, productId),
					eq(productVariantsTable.id, variantId),
				),
			),
	);
	if (updateErr) {
		logOperation({
			...baseContext,
			success: false,
			error: updateErr.message,
			errorStack: updateErr.stack,
			duration: Date.now() - startTime,
		});
		return {
			success: false,
			error: updateErr.message,
			message: "Failed to update product variant",
		};
	}

	// Fire-and-forget: don't block main operation
	createAuditLog({
		userId: Number(session.userId),
		action: "UPDATE",
		entityType: "product_variant",
		entityId: variantId,
		entityName: data.name,
		details: { ...data, productId },
	});

	logOperation({
		...baseContext,
		success: true,
		duration: Date.now() - startTime,
	});

	return {
		success: true,
		data: null,
		message: "Product variant updated successfully",
	};
};

export const deleteProductVariant = async ({
	productId,
	variantId,
}: DeleteProductVariantParams) => {
	const startTime = Date.now();
	const session = await getSession();

	const baseContext = {
		operation: "productVariant.delete",
		entityId: variantId,
		userId: session.isLoggedIn ? Number(session.userId) : undefined,
	};

	if (!session.isLoggedIn) {
		logOperation({
			...baseContext,
			success: false,
			error: "Unauthorized",
			duration: Date.now() - startTime,
		});
		return { success: false, error: "Unauthorized", message: "Unauthorized" };
	}

	// Get variant name before deleting
	const { data: variant } = await tryCatch(
		db
			.select({ name: productVariantsTable.name })
			.from(productVariantsTable)
			.where(
				and(
					eq(productVariantsTable.productId, productId),
					eq(productVariantsTable.id, variantId),
				),
			),
	);

	const { error: deleteErr } = await tryCatch(
		db
			.delete(productVariantsTable)
			.where(
				and(
					eq(productVariantsTable.productId, productId),
					eq(productVariantsTable.id, variantId),
				),
			),
	);
	if (deleteErr) {
		logOperation({
			...baseContext,
			success: false,
			error: deleteErr.message,
			errorStack: deleteErr.stack,
			duration: Date.now() - startTime,
		});
		return {
			success: false,
			error: deleteErr.message,
			message: "Failed to delete product variant",
		};
	}

	// Fire-and-forget: don't block main operation
	createAuditLog({
		userId: Number(session.userId),
		action: "DELETE",
		entityType: "product_variant",
		entityId: variantId,
		entityName: variant?.[0]?.name,
		details: { productId },
	});

	logOperation({
		...baseContext,
		success: true,
		duration: Date.now() - startTime,
	});

	return {
		success: true,
		data: null,
		message: "Product variant deleted successfully",
	};
};
