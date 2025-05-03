import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const ordersTable = pgTable("orders", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	orderNumber: varchar({ length: 255 }).notNull(),
	username: varchar({ length: 255 }).notNull(),
	imageUrl: varchar({ length: 255 }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
