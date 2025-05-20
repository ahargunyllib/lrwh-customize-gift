import type { TemplateData } from "@/shared/types/template";
import { json, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const templatesTable = pgTable("templates", {
	id: text("id").primaryKey(),
	name: varchar({ length: 255 }).notNull(),
	data: json("data").notNull().$type<Omit<TemplateData, "id" | "name">>(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
