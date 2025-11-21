import { integer, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const auditLogsTable = pgTable("audit_logs", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: integer("user_id")
		.notNull()
		.references(() => usersTable.id, { onDelete: "cascade" }),
	action: varchar("action", { length: 50 }).notNull(), // CREATE, UPDATE, DELETE
	entityType: varchar("entity_type", { length: 50 }).notNull(), // product, order, template
	entityId: varchar("entity_id", { length: 255 }).notNull(),
	entityName: varchar("entity_name", { length: 255 }),
	details: jsonb("details"), // Additional details about the action
	createdAt: timestamp("created_at").notNull().defaultNow(),
});
