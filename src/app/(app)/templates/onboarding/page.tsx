import OnboardingForm from "@/features/templates/components/onboarding-form";
import Image from "next/image";
import { Suspense } from "react";

export default function Page() {
	return (
		<section>
			<div className="h-dvh flex flex-col items-center justify-center">
				<div className="space-y-8 px-6 py-8 rounded-xl bg-white sm:w-md m-4 sm:m-0">
					<div className="space-y-2 text-center">
						<h1 className="text-2xl font-bold">Masuk</h1>
						<p className="text-[#344054] text-xs font-medium">
							Isi form dibawah ini untuk mulai kreasikan hadiahmu
						</p>
					</div>

					<Suspense>
						<OnboardingForm />
					</Suspense>
				</div>
			</div>
			<div className="absolute top-0 left-0 min-h-dvh bg-[#F2EFE8] w-screen z-[-1] overflow-hidden">
				<div className="absolute size-[9.5rem] left-[20%] top-[4.5rem]">
					<Image
						src="/svgs/vector-1.svg"
						alt="Vector 1"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-[9rem] right-[20%]  top-[11.5rem]">
					<Image
						src="/svgs/vector-2.svg"
						alt="Vector 2"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-[10rem] right-[1rem] bottom-[12rem]">
					<Image
						src="/svgs/vector-3.svg"
						alt="Vector 3"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-[8rem] right-[-4rem] top-[14rem]">
					<Image
						src="/svgs/vector-4.svg"
						alt="Vector 4"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-[6rem] left-[-1rem] bottom-[10rem]">
					<Image
						src="/svgs/vector-5.svg"
						alt="Vector 5"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-[8rem] left-[40%] bottom-[-2rem]">
					<Image
						src="/svgs/vector-6.svg"
						alt="Vector 6"
						fill
						className="object-contain"
					/>
				</div>
			</div>
		</section>
	);
}
