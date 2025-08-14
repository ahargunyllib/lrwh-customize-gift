import type {
	Order,
	OrderProductVariant,
	Product,
	ProductVariant,
} from "@/shared/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type TemplateStore = {
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
} & {
	updateOrder: (order: TemplateStore["order"]) => void;
	saveTemplate: (
		orderProductVariantId: OrderProductVariant["id"],
		dataURL: string,
	) => void;
	deleteDataURLTemplate: (
		orderProductVariantId: OrderProductVariant["id"],
	) => void;
};

export const useTemplatesStore = create<TemplateStore>()(
	persist(
		(set, get) => ({
			order: {
				id: "",
				username: "",
				orderNumber: "",
				productVariants: [],
			},

			updateOrder: (order: TemplateStore["order"]) => {
				set({
					order,
				});
			},
			saveTemplate(orderProductVariantId, dataURL) {
				const order = get().order;

				console.log(
					"[useTemplatesStore] Saving template for orderProductVariantId:",
					orderProductVariantId,
				);

				const productVariants = order.productVariants.map((pv) => ({
					...pv,
					templates: pv.templates.map((t) => {
						if (t.id === orderProductVariantId) {
							console.log(
								"[useTemplatesStore] Saving template for orderProductVariantId:",
								orderProductVariantId,
							);
							return {
								...t,
								dataURL,
							};
						}

						return t;
					}),
				}));

				set({
					order: {
						...order,
						productVariants,
					},
				});
			},
			deleteDataURLTemplate(orderProductVariantId) {
				const order = get().order;

				console.log(
					"[useTemplatesStore] Deleting template for orderProductVariantId:",
					orderProductVariantId,
				);

				const productVariants = order.productVariants.map((pv) => ({
					...pv,
					templates: pv.templates.map((t) => {
						if (t.id === orderProductVariantId) {
							console.log(
								"[useTemplatesStore] Deleting template for orderProductVariantId:",
								orderProductVariantId,
							);
							return {
								...t,
								dataURL: null, // Clear the data URL
							};
						}

						return t;
					}),
				}));

				set({
					order: {
						...order,
						productVariants,
					},
				});
			},
		}),
		{
			name: "templates-store",
			storage: createJSONStorage(() => sessionStorage),
		},
	),
);
