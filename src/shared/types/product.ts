export type Product = {
	id: string;
	name: string;
	description: string | null;
	shopeeUrl: string | null;
	createdAt: Date;
	updatedAt: Date;
};

export type ProductVariant = {
	id: string;
	name: string;
	description: string | null;
	width: number;
	height: number;
	productId: string;
	createdAt: Date;
	updatedAt: Date;
};
