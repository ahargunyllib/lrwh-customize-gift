"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { roleEnum } from "@/shared/lib/enums";
import { useSessionQuery } from "@/shared/repository/session-manager/query";
import { useGetUserQuery } from "@/shared/repository/user/query";
import PasswordForm from "../components/password-form";
import ProfileForm from "../components/profile-form";

export default function ProfileContainer() {
	const { data: session, isLoading: sessionLoading } = useSessionQuery();

	const userId =
		session?.isLoggedIn === true ? Number(session.userId) : undefined;

	const { data: res, isLoading: userLoading } = useGetUserQuery({
		id: userId ?? 0,
	});

	if (sessionLoading || userLoading) {
		return (
			<Card>
				<CardContent className="py-8">
					<p className="text-center text-muted-foreground">Loading...</p>
				</CardContent>
			</Card>
		);
	}

	if (!session?.isLoggedIn || !userId) {
		return (
			<Card>
				<CardContent className="py-8">
					<p className="text-center text-muted-foreground">
						Please log in to view your profile.
					</p>
				</CardContent>
			</Card>
		);
	}

	if (!res?.success) {
		return (
			<Card>
				<CardContent className="py-8">
					<p className="text-center text-muted-foreground">
						Failed to load profile.
					</p>
				</CardContent>
			</Card>
		);
	}

	const user = res.data.user;

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Profile Information</CardTitle>
							<CardDescription>
								Update your account profile information.
							</CardDescription>
						</div>
						<Badge variant="secondary" className="capitalize">
							{roleEnum[user.role as keyof typeof roleEnum] ?? "Unknown"}
						</Badge>
					</div>
				</CardHeader>
				<CardContent>
					<ProfileForm
						userId={userId}
						defaultValues={{
							name: user.name,
							email: user.email,
						}}
					/>
				</CardContent>
			</Card>

			<Separator />

			<Card>
				<CardHeader>
					<CardTitle>Change Password</CardTitle>
					<CardDescription>
						Ensure your account is using a strong password.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<PasswordForm userId={userId} />
				</CardContent>
			</Card>
		</div>
	);
}
