"use client";

import { useDialogStore } from "@/shared/hooks/use-dialog";
import {
	type UpdateOrderRequest,
	updateOrderSchema,
} from "@/shared/repository/order/dto";
import { useUpdateOrderMutation } from "@/shared/repository/order/query";
import type { Order, Product, ProductVariant } from "@/shared/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type OrderData = {
	id: Order["id"];
	orderNumber: Order["orderNumber"];
	username: Order["username"];
	products: {
		id: Product["id"];
		name: Product["name"];
		productVariant: {
			id: ProductVariant["id"];
			name: ProductVariant["name"];
		};
	}[];
};

export const useEditOrderForm = (order: OrderData) => {
	const { mutate: updateOrder, isPending } = useUpdateOrderMutation({
		id: order.id,
	});
	const { closeDialog } = useDialogStore();

	// Count the occurrences of each product variant
	const productVariantCounts = order.products.reduce(
		(acc, product) => {
			const variantId = product.productVariant.id;
			acc[variantId] = (acc[variantId] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);

	// Convert to the format expected by the form
	const initialProductVariants = Object.entries(productVariantCounts).map(
		([productVariantId, quantity]) => ({
			productVariantId,
			quantity,
		}),
	);

	const form = useForm<UpdateOrderRequest>({
		resolver: zodResolver(updateOrderSchema),
		defaultValues: {
			orderNumber: order.orderNumber,
			username: order.username,
			productVariants: initialProductVariants,
		},
	});

	const onSubmitHandler = form.handleSubmit((data) => {
		updateOrder(data, {
			onSuccess: (res) => {
				if (!res.success) {
					toast.error(res.message || "Failed to update order");
					return;
				}

				form.reset();
				closeDialog();
				toast.success(res.message || "Order updated successfully");
			},
		});
	});

	return {
		...form,
		isLoading: isPending,
		onSubmitHandler,
	};
};
