export type AuditLog = {
	id: string;
	userId: number;
	action: "CREATE" | "UPDATE" | "DELETE";
	entityType: "product" | "product_variant" | "order" | "template";
	entityId: string;
	entityName: string | null;
	details: Record<string, unknown> | null;
	createdAt: Date;
	user?: {
		id: number;
		name: string;
		email: string;
	};
};
