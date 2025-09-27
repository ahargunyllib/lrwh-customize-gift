import OnboardingForm from "@/features/templates/components/onboarding-form";
import Image from "next/image";

export default function Page() {
	return (
		<section>
			<div className="h-dvh flex flex-col items-center justify-center ">
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
				<div className="absolute size-[29rem] left-[-18.5rem] top-[-11rem] md:left-[-7rem] md:top-[-8.5rem]">
					<Image
						src="/imgs/product-image-1.png"
						alt="Product Image 1"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-[6rem] left-[4.5rem] top-[1.5rem] md:left-[16rem] md:top-[4rem]">
					<Image
						src="/svgs/vector-6.svg"
						alt="Vector 6"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-6 left-[16rem] top-[24rem] md:visible invisible">
					<Image
						src="/svgs/vector-2.svg"
						alt="Vector 2"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-[9rem] md:size-[15rem] left-[-1.25rem] bottom-[-1rem] md:left-[0rem] md:bottom-[8rem]">
					<Image
						src="/imgs/product-image-3.png"
						alt="Product Image 3"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-[4rem] md:size-[6rem] left-[-3rem] bottom-[4rem] md:left-[-2rem] md:bottom-[16rem]">
					<Image
						src="/svgs/vector-1.svg"
						alt="Vector 1"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-[5rem] right-[-1rem] bottom-[-1rem] md:left-1/2 md:bottom-[-1rem]">
					<Image
						src="/svgs/vector-3.svg"
						alt="Vector 3"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-[12rem] right-[-3rem] top-[5rem] md:visible invisible">
					<Image
						src="/svgs/vector-5.svg"
						alt="Vector 5"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-[4rem] md:size-[6rem] top-[28rem] right-[1rem] md:right-[14rem] md:top-[20rem]">
					<Image
						src="/svgs/vector-7.svg"
						alt="Vector 7"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-[8rem] md:size-[12rem] md:right-[6rem] right-[-4rem] top-[24rem] md:top-[15rem]">
					<Image
						src="/imgs/product-image-2.png"
						alt="Product Image 2"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-[1.5rem] right-[6rem] bottom-[20rem] md:visible invisible">
					<Image
						src="/svgs/vector-4.svg"
						alt="Vector 4"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-[23rem] right-[2rem] bottom-[-7rem] md:visible invisible">
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
