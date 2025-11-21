import { z } from "zod";

export type User = {
	id: number;
	name: string;
	email: string;
	role: number;
	createdAt: Date;
};

export type GetUserParams = {
	id: number;
};

export type GetUserResponse = {
	user: Omit<User, "createdAt"> & { createdAt: string };
};

export const updateUserSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email address"),
});

export type UpdateUserRequest = z.infer<typeof updateUserSchema>;

export type UpdateUserParams = {
	id: number;
};

export const updatePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, "Current password is required"),
		newPassword: z.string().min(6, "Password must be at least 6 characters"),
		confirmPassword: z.string().min(1, "Confirm password is required"),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export type UpdatePasswordRequest = z.infer<typeof updatePasswordSchema>;

export type UpdatePasswordParams = {
	id: number;
};
