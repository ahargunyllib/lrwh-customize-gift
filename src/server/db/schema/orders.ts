import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { productVariantsTable } from "./products";

export const ordersTable = pgTable("orders", {
	id: uuid("id").primaryKey().defaultRandom(),
	orderNumber: varchar("order_number", { length: 255 }).notNull(),
	username: varchar({ length: 255 }).notNull(),
	imageUrl: varchar("image_url", { length: 255 }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderProductVariantsTable = pgTable("order_product_variants", {
	id: uuid("id").primaryKey().defaultRandom(),
	orderId: uuid("order_id")
		.notNull()
		.references(() => ordersTable.id, { onDelete: "cascade" }),
	productVariantId: uuid("product_variant_id")
		.notNull()
		.references(() => productVariantsTable.id, { onDelete: "cascade" }),
});
