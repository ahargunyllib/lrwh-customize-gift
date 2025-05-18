"use server";

import { db } from "@/server/db";
import { tryCatch } from "@/shared/lib/try-catch";
import type { TemplateData, TemplateEntity } from "@/shared/types/template";
import { sql } from "drizzle-orm";
import type { CreateTemplateRequest, UpdateTemplateRequest } from "./dto";

export const getTemplates = async () => {
	const queryBuilder = `
    select *
    from templates
  `;

	const { data, error } = await tryCatch(
		db.execute<TemplateEntity>(queryBuilder),
	);
	if (error) {
		console.error(error);
		return {
			success: false,
			error: error.message,
			message: "Failed to fetch templates",
		};
	}

	const { rows: templates } = data;

	console.log(templates);

	let parsedTemplates: TemplateData[] = [];

	parsedTemplates = templates.map((template) => {
		return {
			id: template.id,
			name: template.name,
			...template.data,
		};
	});

	return {
		success: true,
		data: {
			templates: parsedTemplates,
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
		...templates[0].data,
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
	};

	const queryBuilder = sql`
    insert into templates (id, name, data)
    values (${req.id}, ${req.name}, ${data})
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
	};

	const queryBuilder = sql`
    update templates
    set name = ${req.name}, data = ${data}
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
