"use client";

import { Button } from "@/shared/components/ui/button";
import {
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { useDialogStore } from "@/shared/hooks/use-dialog";
import {
	type Admin,
	type UpdateAdminRequest,
	updateAdminSchema,
} from "@/shared/repository/admin/dto";
import { useUpdateAdminMutation } from "@/shared/repository/admin/query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
	admin: Admin;
};

export default function UpdateUserFormDialog({ admin }: Props) {
	const { closeDialog } = useDialogStore();
	const { mutate: updateAdmin, isPending } = useUpdateAdminMutation({
		id: admin.id,
	});

	const form = useForm<UpdateAdminRequest>({
		resolver: zodResolver(updateAdminSchema),
		defaultValues: {
			name: admin.name,
			email: admin.email,
		},
	});

	const onSubmit = (data: UpdateAdminRequest) => {
		updateAdmin(data, {
			onSuccess: (res) => {
				if (!res.success) {
					toast.error(res.error || "Failed to update user");
					return;
				}
				toast.success(res.message || "User updated successfully");
				closeDialog();
			},
		});
	};

	return (
		<DialogContent className="sm:max-w-[425px]">
			<DialogHeader>
				<DialogTitle>Edit User</DialogTitle>
				<DialogDescription>
					Update user information.
				</DialogDescription>
			</DialogHeader>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input placeholder="Enter name" {...field} />
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
									<Input type="email" placeholder="Enter email" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={closeDialog}>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? "Saving..." : "Save Changes"}
						</Button>
					</DialogFooter>
				</form>
			</Form>
		</DialogContent>
	);
}
