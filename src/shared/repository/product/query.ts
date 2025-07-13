"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createProduct,
	createProductVariant,
	deleteProduct,
	deleteProductVariant,
	getProducts,
	updateProduct,
	updateProductVariant,
} from "./action";

import type {
	CreateProductRequest,
	CreateProductVariantParams,
	CreateProductVariantRequest,
	DeleteProductParams,
	DeleteProductVariantParams,
	GetProductsQuery,
	UpdateProductParams,
	UpdateProductRequest,
	UpdateProductVariantParams,
	UpdateProductVariantRequest,
} from "./dto";

export const useGetProductsQuery = (query: GetProductsQuery) => {
	return useQuery({
		queryKey: ["products", query],
		queryFn: () => getProducts(query),
	});
};

export const useCreateProductMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateProductRequest) => createProduct(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
		},
	});
};

export const useUpdateProductMutation = (params: UpdateProductParams) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: UpdateProductRequest) => updateProduct(params, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
		},
	});
};

export const useDeleteProductMutation = (params: DeleteProductParams) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => deleteProduct(params),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
		},
	});
};

export const useCreateProductVariantMutation = (
	params: CreateProductVariantParams,
) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateProductVariantRequest) =>
			createProductVariant(params, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
		},
	});
};

export const useUpdateProductVariantMutation = (
	params: UpdateProductVariantParams,
) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: UpdateProductVariantRequest) =>
			updateProductVariant(params, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
		},
	});
};

export const useDeleteProductVariantMutation = (
	params: DeleteProductVariantParams,
) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => deleteProductVariant(params),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
		},
	});
};
