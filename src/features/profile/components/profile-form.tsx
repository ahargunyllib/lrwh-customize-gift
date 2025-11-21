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
	type UpdateUserRequest,
	updateUserSchema,
} from "@/shared/repository/user/dto";
import { useUpdateUserMutation } from "@/shared/repository/user/query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
	userId: number;
	defaultValues: UpdateUserRequest;
};

export default function ProfileForm({ userId, defaultValues }: Props) {
	const form = useForm<UpdateUserRequest>({
		resolver: zodResolver(updateUserSchema),
		defaultValues,
	});

	const { mutate: updateUser, isPending } = useUpdateUserMutation({ id: userId });

	const onSubmitHandler = form.handleSubmit((data) => {
		updateUser(data, {
			onSuccess: (res) => {
				if (!res.success) {
					toast.error(res.error || "Failed to update profile");
					return;
				}
				toast.success(res.message || "Profile updated successfully");
			},
		});
	});

	return (
		<Form {...form}>
			<form onSubmit={onSubmitHandler} className="space-y-4">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input {...field} placeholder="Enter your name" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input {...field} type="email" placeholder="Enter your email" />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit" disabled={isPending}>
					{isPending ? "Saving..." : "Save Changes"}
				</Button>
			</form>
		</Form>
	);
}
