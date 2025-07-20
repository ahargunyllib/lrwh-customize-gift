import {
	integer,
	pgTable,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const productsTable = pgTable("products", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 255 }).notNull(),
	description: varchar("description", { length: 1000 }),
	shopeeUrl: varchar("shopee_url", { length: 255 }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const productVariantsTable = pgTable("product_variants", {
	id: uuid("id").primaryKey().defaultRandom(),
	productId: uuid("product_id")
		.notNull()
		.references(() => productsTable.id, { onDelete: "cascade" }),
	name: varchar("variant_name", { length: 255 }).notNull(),
	description: varchar("description", { length: 1000 }),
	width: integer("width").notNull().default(0),
	height: integer("height").notNull().default(0),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});
