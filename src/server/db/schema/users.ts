import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull().unique(),
	role: integer().notNull(), // 1: admin, 2: user
	password: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
