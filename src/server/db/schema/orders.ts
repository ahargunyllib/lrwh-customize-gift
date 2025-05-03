import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const ordersTable = pgTable("orders", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	order_number: varchar({ length: 255 }).notNull(),
	username: varchar({ length: 255 }).notNull(),
	image_url: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
