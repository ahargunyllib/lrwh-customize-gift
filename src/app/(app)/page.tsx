import OnboardingFormModalContainer from "@/features/editor/containers/onboarding-form-modal-container";
import TemplateSelector from "@/features/editor/containers/template-selector";

export default function Page() {
	return (
		<>
			<TemplateSelector />
			<OnboardingFormModalContainer />
		</>
	);
}
