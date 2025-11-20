import type { TemplateData } from "@/shared/types/template";
import {
	json,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { productVariantsTable } from "./products";

export const templatesTable = pgTable("templates", {
	id: text("id").primaryKey(),
	name: varchar({ length: 255 }).notNull(),
	productVariantId: uuid("product_variant_id")
		.notNull()
		.references(() => productVariantsTable.id, { onDelete: "cascade" }),
	data: json("data").notNull().$type<Omit<TemplateData, "id" | "name" | "productVariantId" | "previewUrl" | "previewFile">>(),
  previewUrl: text("preview_url"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
