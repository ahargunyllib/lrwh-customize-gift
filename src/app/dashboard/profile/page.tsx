import ProfileContainer from "@/features/profile/containers/profile-container";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Suspense } from "react";

export default function Page() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Profile</CardTitle>
				<CardDescription>
					Manage your account settings and preferences.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Suspense fallback={<div>Loading...</div>}>
					<ProfileContainer />
				</Suspense>
			</CardContent>
		</Card>
	);
}
