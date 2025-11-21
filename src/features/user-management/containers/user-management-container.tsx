"use client";

import { Button } from "@/shared/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { useDialogStore } from "@/shared/hooks/use-dialog";
import { useGetAllAdminsQuery } from "@/shared/repository/admin/query";
import { PlusIcon } from "lucide-react";
import CreateUserFormDialog from "../components/create-user-form-dialog";
import UserTable from "../components/user-table";

export default function UserManagementContainer() {
	const { openDialog } = useDialogStore();
	const { data: response, isLoading } = useGetAllAdminsQuery();

	const admins = response?.success ? response.data?.admins ?? [] : [];

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle>User Management</CardTitle>
					<CardDescription>
						Manage admin users in the system.
					</CardDescription>
				</div>
				<Button
					onClick={() => {
						openDialog({
							children: <CreateUserFormDialog />,
						});
					}}
				>
					<PlusIcon className="mr-2 h-4 w-4" />
					Add User
				</Button>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="flex items-center justify-center h-32">
						<p className="text-muted-foreground">Loading users...</p>
					</div>
				) : (
					<UserTable data={admins} />
				)}
			</CardContent>
		</Card>
	);
}
