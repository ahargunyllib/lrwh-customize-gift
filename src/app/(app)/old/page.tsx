import OnboardingFormModalContainer from "@/features/editor/containers/onboarding-form-modal-container";
import TemplateSelector from "@/features/editor/containers/template-selector";
import { Suspense } from "react";

export default function Page() {
	return (
		<Suspense>
			<TemplateSelector />
			<OnboardingFormModalContainer />
		</Suspense>
	);
}
