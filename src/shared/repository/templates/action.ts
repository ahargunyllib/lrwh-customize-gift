"use server";

import { db } from "@/server/db";
import { templatesTable } from "@/server/db/schema/templates";
import { tryCatch } from "@/shared/lib/try-catch";
import type { TemplateData, TemplateEntity } from "@/shared/types/template";
import { asc, count, eq, sql } from "drizzle-orm";
import { uploadFileToS3 } from "../../../server/s3";
import type { Pagination, ProductVariant } from "../../types";
import { createAuditLog } from "../audit-log/action";
import { getSession } from "../session-manager/action";
import type { CreateTemplateRequest, UpdateTemplateRequest } from "./dto";

export const getTemplates = async (query?: {
	productVariantId?: ProductVariant["id"];
	page?: number;
	limit?: number;
}) => {
	const LIMIT = query?.limit || 10;
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
			.offset((page - 1) * LIMIT)
			.orderBy(asc(templatesTable.name)),
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
			previewUrl: template.previewUrl,
			previewFile: null,
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
		productVariantId: templates[0].product_variant_id,
		previewUrl: templates[0].preview_url,
		previewFile: null,
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
	const session = await getSession();
	if (!session.isLoggedIn) {
		return { success: false, error: "Unauthorized", message: "Unauthorized" };
	}

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

	let previewUrl: string | null = null;
	if (req.previewFile) {
		const { data: uploadRes, error: uploadErr } = await tryCatch(
			uploadFileToS3(req.previewFile),
		);
		if (uploadErr) {
			console.error(uploadErr);
			return {
				success: false,
				error: uploadErr.message,
				message: "Failed to upload preview file",
			};
		}

		if (!uploadRes.success) {
			return {
				success: false,
				error: new Error(uploadRes.message || "Upload failed"),
				message: "Failed to upload preview file",
			};
		}

		previewUrl = uploadRes.data?.fileUrl ?? null;
	}

	const queryBuilder = sql`
    insert into templates (id, name, product_variant_id, preview_url, data)
    values (${req.id}, ${req.name}, ${req.productVariantId}, ${previewUrl}, ${data})
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

	await createAuditLog({
		userId: Number(session.userId),
		action: "CREATE",
		entityType: "template",
		entityId: req.id,
		entityName: req.name,
		details: { name: req.name, productVariantId: req.productVariantId },
	});

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
	const session = await getSession();
	if (!session.isLoggedIn) {
		return { success: false, error: "Unauthorized", message: "Unauthorized" };
	}

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

	let previewUrl: string | null = req.previewUrl || null;
	if (req.previewFile) {
		console.log("Uploading new preview file...");
		const { data: uploadRes, error: uploadErr } = await tryCatch(
			uploadFileToS3(req.previewFile),
		);
		if (uploadErr) {
			console.error(uploadErr);
			return {
				success: false,
				error: uploadErr.message,
				message: "Failed to upload preview file",
			};
		}
		console.log("Preview file uploaded:", uploadRes);

		if (!uploadRes.success) {
			return {
				success: false,
				error: new Error(uploadRes.message || "Upload failed"),
				message: "Failed to upload preview file",
			};
		}

		previewUrl = uploadRes.data?.fileUrl ?? null;
	}

	console.log("Updating template with previewUrl:", previewUrl);

	const queryBuilder = sql`
    update templates
    set name = ${req.name}, data = ${data}, product_variant_id = ${req.productVariantId}, preview_url = ${previewUrl}
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

	await createAuditLog({
		userId: Number(session.userId),
		action: "UPDATE",
		entityType: "template",
		entityId: id,
		entityName: req.name,
		details: { name: req.name, productVariantId: req.productVariantId },
	});

	return {
		success: true,
		data: null,
		message: "Template updated successfully",
	};
};

export const deleteTemplate = async (id: TemplateEntity["id"]) => {
	const session = await getSession();
	if (!session.isLoggedIn) {
		return { success: false, error: "Unauthorized", message: "Unauthorized" };
	}

	// Get template name before deleting
	const { data: template } = await tryCatch(
		db.select({ name: templatesTable.name }).from(templatesTable).where(eq(templatesTable.id, id)),
	);

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

	await createAuditLog({
		userId: Number(session.userId),
		action: "DELETE",
		entityType: "template",
		entityId: id,
		entityName: template?.[0]?.name,
	});

	return {
		success: true,
		data: null,
		message: "Template deleted successfully",
	};
};
