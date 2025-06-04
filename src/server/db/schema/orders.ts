import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const ordersTable = pgTable("orders", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	orderNumber: varchar("order_number", { length: 255 }).notNull(),
	username: varchar({ length: 255 }).notNull(),
	imageUrl: varchar("image_url", { length: 255 }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
