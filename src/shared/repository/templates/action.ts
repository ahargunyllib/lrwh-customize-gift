"use server";

import { db } from "@/server/db";
import { templatesTable } from "@/server/db/schema/templates";
import { tryCatch } from "@/shared/lib/try-catch";
import type { TemplateData, TemplateEntity } from "@/shared/types/template";
import { count, eq, sql } from "drizzle-orm";
import type { Pagination, ProductVariant } from "../../types";
import type { CreateTemplateRequest, UpdateTemplateRequest } from "./dto";

export const getTemplates = async (query?: {
	productVariantId?: ProductVariant["id"];
	page?: number;
}) => {
	const LIMIT = 10;
	const page = query?.page || 1;

	const { data: templates, error } = await tryCatch(
		db
			.select()
			.from(templatesTable)
			.where(
				query?.productVariantId
					? eq(templatesTable.productVariantId, query.productVariantId)
					: undefined,
			)
			.limit(LIMIT)
			.offset((page - 1) * LIMIT),
	);
	if (error) {
		console.error(error);
		return {
			success: false,
			error: error.message,
			message: "Failed to fetch templates",
		};
	}

	const { data: meta, error: countError } = await tryCatch(
		db
			.select({
				count: count(templatesTable.id),
			})
			.from(templatesTable)
			.where(
				query?.productVariantId
					? eq(templatesTable.productVariantId, query.productVariantId)
					: undefined,
			),
	);
	if (countError) {
		console.error(countError);
		return {
			success: false,
			error: countError.message,
			message: "Failed to fetch templates count",
		};
	}

	let parsedTemplates: TemplateData[] = [];

	parsedTemplates = templates.map((template) => {
		return {
			id: template.id,
			name: template.name,
			productVariantId: template.productVariantId,
			...template.data,
			images: template.data?.images || [],
			texts: template.data?.texts || [],
			shapes: template.data?.shapes || [],
			lines: template.data?.lines || [],
			layer: template.data?.layer ?? [
				...(template.data?.images?.map((i) => i.id) ?? []),
				...(template.data?.texts?.map((t) => t.id) ?? []),
				...(template.data?.shapes?.map((s) => s.id) ?? []),
				...(template.data?.lines?.map((l) => l.id) ?? []),
			],
		};
	});

	const pagination: Pagination = {
		total_data: meta[0].count,
		total_page: Math.ceil(meta[0].count / (LIMIT || 10)),
		page: page || 1,
		limit: LIMIT || 10,
	};

	return {
		success: true,
		data: {
			templates: parsedTemplates,
			pagination,
		},
		message: "Templates fetched successfully",
	};
};

export const getTemplateById = async (id: TemplateEntity["id"]) => {
	const queryBuilder = sql`
    select *
    from templates
    where id = ${id}
  `;

	const { data, error } = await tryCatch(
		db.execute<TemplateEntity>(queryBuilder),
	);
	if (error) {
		console.error(error);
		return {
			success: false,
			error: error.message,
			message: "Failed to fetch template",
		};
	}

	const { rows: templates } = data;

	if (templates.length === 0) {
		return {
			success: false,
			error: "Template not found",
			message: "Template not found",
		};
	}

	const template: TemplateData = {
		id: templates[0].id,
		name: templates[0].name,
		productVariantId: templates[0].productVariantId,
		...templates[0].data,
		images: templates[0].data?.images || [],
		texts: templates[0].data?.texts || [],
		shapes: templates[0].data?.shapes || [],
		lines: templates[0].data?.lines || [],
		layer: templates[0].data?.layer ?? [
			...(templates[0].data?.images?.map((i) => i.id) ?? []),
			...(templates[0].data?.texts?.map((t) => t.id) ?? []),
			...(templates[0].data?.shapes?.map((s) => s.id) ?? []),
			...(templates[0].data?.lines?.map((l) => l.id) ?? []),
		],
	};

	return {
		success: true,
		data: {
			template,
		},
		message: "Template fetched successfully",
	};
};

export const createTemplate = async (req: CreateTemplateRequest) => {
	const data = {
		width: req.width,
		height: req.height,
		backgroundColor: req.backgroundColor,
		backgroundImage: req.backgroundImage,
		images: req.images,
		texts: req.texts,
		shapes: req.shapes,
		lines: req.lines,
		layer: req.layer,
	};

	const queryBuilder = sql`
    insert into templates (id, name, product_variant_id, data)
    values (${req.id}, ${req.name}, ${req.productVariantId}, ${data})
  `;

	console.log(queryBuilder, "queryBuilder");

	const { error } = await tryCatch(db.execute(queryBuilder));
	if (error) {
		console.error(error);
		return {
			success: false,
			error: error.message,
			message: "Failed to create template",
		};
	}

	return {
		success: true,
		data: null,
		message: "Template created successfully",
	};
};

export const updateTemplate = async (
	req: UpdateTemplateRequest,
	id: TemplateEntity["id"],
) => {
	const data = {
		width: req.width,
		height: req.height,
		backgroundColor: req.backgroundColor,
		backgroundImage: req.backgroundImage,
		images: req.images,
		texts: req.texts,
		shapes: req.shapes,
		lines: req.lines,
		layer: req.layer,
	};

	const queryBuilder = sql`
    update templates
    set name = ${req.name}, data = ${data}, product_variant_id = ${req.productVariantId}
    where id = ${id}
  `;

	const { error } = await tryCatch(db.execute(queryBuilder));
	if (error) {
		console.error(error);
		return {
			success: false,
			error: error.message,
			message: "Failed to update template",
		};
	}

	return {
		success: true,
		data: null,
		message: "Template updated successfully",
	};
};

export const deleteTemplate = async (id: TemplateEntity["id"]) => {
	const queryBuilder = sql`
    delete from templates
    where id = ${id}
  `;

	const { error } = await tryCatch(db.execute(queryBuilder));
	if (error) {
		console.error(error);
		return {
			success: false,
			error: error.message,
			message: "Failed to delete template",
		};
	}

	return {
		success: true,
		data: null,
		message: "Template deleted successfully",
	};
};
