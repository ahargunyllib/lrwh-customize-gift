"use client";

import { Button } from "@/shared/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import {
	type UpdatePasswordRequest,
	updatePasswordSchema,
} from "@/shared/repository/user/dto";
import { useUpdatePasswordMutation } from "@/shared/repository/user/query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
	userId: number;
};

export default function PasswordForm({ userId }: Props) {
	const form = useForm<UpdatePasswordRequest>({
		resolver: zodResolver(updatePasswordSchema),
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
	});

	const { mutate: updatePassword, isPending } = useUpdatePasswordMutation({
		id: userId,
	});

	const onSubmitHandler = form.handleSubmit((data) => {
		updatePassword(data, {
			onSuccess: (res) => {
				if (!res.success) {
					toast.error(res.error || "Failed to update password");
					return;
				}
				toast.success(res.message || "Password updated successfully");
				form.reset();
			},
		});
	});

	return (
		<Form {...form}>
			<form onSubmit={onSubmitHandler} className="space-y-4">
				<FormField
					control={form.control}
					name="currentPassword"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Current Password</FormLabel>
							<FormControl>
								<Input
									{...field}
									type="password"
									placeholder="Enter current password"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="newPassword"
					render={({ field }) => (
						<FormItem>
							<FormLabel>New Password</FormLabel>
							<FormControl>
								<Input
									{...field}
									type="password"
									placeholder="Enter new password"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="confirmPassword"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Confirm Password</FormLabel>
							<FormControl>
								<Input
									{...field}
									type="password"
									placeholder="Confirm new password"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit" disabled={isPending}>
					{isPending ? "Updating..." : "Update Password"}
				</Button>
			</form>
		</Form>
	);
}
