import Image from "next/image";

export default function Background() {
	return (
		<div className="absolute top-0 left-0 inset-0 min-h-dvh bg-[#F2EFE8] w-screen z-[-1] overflow-hidden">
			<div className="absolute size-[8rem] right-[25%] bottom-[-2rem]">
				<Image
					src="/svgs/vector-6.svg"
					alt="Vector 6"
					fill
					className="object-contain"
				/>
			</div>

			<div className="absolute size-[8rem] left-[20%] top-[15%]">
				<Image
					src="/svgs/vector-7.svg"
					alt="Vector 7"
					fill
					className="object-contain"
				/>
			</div>

			<div className="absolute size-[11rem] right-[-2rem] top-[2rem]">
				<Image
					src="/svgs/vector-8.svg"
					alt="Vector 8"
					fill
					className="object-contain"
				/>
			</div>

			<div className="absolute size-[7rem] right-[3rem] top-[30%]">
				<Image
					src="/svgs/vector-9.svg"
					alt="Vector 9"
					fill
					className="object-contain"
				/>
			</div>

			<div className="absolute size-[9rem] left-[-2rem] bottom-[2rem]">
				<Image
					src="/svgs/vector-10.svg"
					alt="Vector 10"
					fill
					className="object-contain"
				/>
			</div>
		</div>
	);
}
