"use client";

import { useSessionQuery } from "@/shared/repository/session-manager/query";
import { RotateCwIcon } from "lucide-react";
import OnboardingFormModal from "../components/onboarding-form-modal";

export default function OnboardingFormModalContainer() {
	const { data: res } = useSessionQuery();
	if (!res) {
		return (
			<div className="fixed inset-0 flex flex-col items-center justify-center backdrop-blur-xs bg-black/50">
				<RotateCwIcon className="animate-spin text-white size-24" />
				<div className="text-white text-2xl">Loading...</div>
			</div>
		);
	}

	const defaultOpen = !res.isLoggedIn;

	return <OnboardingFormModal defaultOpen={defaultOpen} />;
}
