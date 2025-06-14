"use client";

import { useSessionQuery } from "@/shared/repository/session-manager/query";
import { useMemo } from "react";
import OnboardingFormModal from "../components/onboarding-form-modal";

export default function OnboardingFormModalContainer() {
	const { data: res } = useSessionQuery();

	const defaultOpen = useMemo(() => {
		return !res?.isLoggedIn;
	}, [res?.isLoggedIn]);

	return <OnboardingFormModal defaultOpen={defaultOpen} />;
}
