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
	type CreateAdminRequest,
	createAdminSchema,
} from "@/shared/repository/admin/dto";
import { useCreateAdminMutation } from "@/shared/repository/admin/query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function CreateUserFormDialog() {
	const { closeDialog } = useDialogStore();
	const { mutate: createAdmin, isPending } = useCreateAdminMutation();

	const form = useForm<CreateAdminRequest>({
		resolver: zodResolver(createAdminSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
		},
	});

	const onSubmit = (data: CreateAdminRequest) => {
		createAdmin(data, {
			onSuccess: (res) => {
				if (!res.success) {
					toast.error(res.error || "Failed to create user");
					return;
				}
				toast.success(res.message || "User created successfully");
				closeDialog();
			},
		});
	};

	return (
		<DialogContent className="sm:max-w-[425px]">
			<DialogHeader>
				<DialogTitle>Create New User</DialogTitle>
				<DialogDescription>
					Add a new admin user to the system.
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
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Password</FormLabel>
								<FormControl>
									<Input
										type="password"
										placeholder="Enter password"
										{...field}
									/>
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
							{isPending ? "Creating..." : "Create User"}
						</Button>
					</DialogFooter>
				</form>
			</Form>
		</DialogContent>
	);
}
