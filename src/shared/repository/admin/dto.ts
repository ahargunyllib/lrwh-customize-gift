import { z } from "zod";

export type Admin = {
	id: number;
	name: string;
	email: string;
	role: number;
	createdAt: string;
};

export type GetAllAdminsResponse = {
	admins: Admin[];
};

export type GetAdminParams = {
	id: number;
};

export type GetAdminResponse = {
	admin: Admin;
};

export const createAdminSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email address"),
	password: z.string().min(6, "Password must be at least 6 characters"),
});

export type CreateAdminRequest = z.infer<typeof createAdminSchema>;

export const updateAdminSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email address"),
});

export type UpdateAdminRequest = z.infer<typeof updateAdminSchema>;

export type UpdateAdminParams = {
	id: number;
};

export type DeleteAdminParams = {
	id: number;
};
