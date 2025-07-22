import OnboardingForm from "@/features/onboarding/components/onboarding-form";

export default function Page() {
	return (
		<div className="h-dvh flex flex-col items-center justify-center bg-white">
			<div className="space-y-8 px-6">
				<div className="space-y-2 text-center">
					<h1 className="text-2xl font-bold">Masuk</h1>
					<p className="text-[#344054] text-xs font-medium">
						Isi form dibawah ini untuk mulai kreasikan hadiahmu
					</p>
				</div>

				<OnboardingForm />
			</div>
		</div>
	);
}
