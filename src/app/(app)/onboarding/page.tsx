import OnboardingForm from "@/features/onboarding/components/onboarding-form";
import Image from "next/image";

export default function Page() {
	return (
		<section>
			<div className="h-dvh flex flex-col items-center justify-center">
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
			<div className="absolute top-0 left-0 min-h-dvh bg-white w-screen z-[-1] overflow-hidden">
				<div className="absolute size-[29rem] left-[-7rem] top-[-8.5rem]">
					<Image
						src="/imgs/product-image-1.png"
						alt="Product Image 1"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-[6rem] left-[16rem] top-[4rem]">
					<Image
						src="/svgs/vector-6.svg"
						alt="Vector 6"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-6 left-[16rem] top-[24rem]">
					<Image
						src="/svgs/vector-2.svg"
						alt="Vector 2"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-[15rem] left-[0rem] bottom-[8rem]">
					<Image
						src="/imgs/product-image-3.png"
						alt="Product Image 3"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-[6rem] left-[-2rem] bottom-[16rem]">
					<Image
						src="/svgs/vector-1.svg"
						alt="Vector 1"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-[5rem] left-1/2 bottom-[-1rem]">
					<Image
						src="/svgs/vector-3.svg"
						alt="Vector 3"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-[12rem] right-[-3rem] top-[5rem]">
					<Image
						src="/svgs/vector-5.svg"
						alt="Vector 5"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-[6rem] right-[14rem] top-[20rem]">
					<Image
						src="/svgs/vector-7.svg"
						alt="Vector 7"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-[12rem] right-[6rem] top-[15rem]">
					<Image
						src="/imgs/product-image-2.png"
						alt="Product Image 2"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-[1.5rem] right-[6rem] bottom-[20rem]">
					<Image
						src="/svgs/vector-4.svg"
						alt="Vector 4"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-[23rem] right-[2rem] bottom-[-7rem]">
					<Image
						src="/imgs/product-image-4.png"
						alt="Product Image 4"
						fill
						className="object-contain"
					/>
				</div>
			</div>
		</section>
	);
}
