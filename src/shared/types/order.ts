import type { ProductVariant } from "./product";

export type Order = {
	id: string;
	orderNumber: string;
	username: string;
	createdAt: Date;
};

export type OrderProductVariant = {
	id: string;
	orderId: Order["id"];
	productVariantId: ProductVariant["id"];
	imageUrl: string | null;
};
