import Image from "next/image";

export default function Background() {
	return (
		<div className="absolute top-0 left-0 inset-0 min-h-dvh bg-[#F2F4F7] w-screen z-[-1] overflow-hidden">
			<div className="absolute size-28 md:size-30 left-[18.5rem] top-[10.5rem]">
				<Image
					src="/svgs/peach-flower.svg"
					alt="Peach Flower"
					fill
					className="object-contain"
				/>
			</div>

			<div className="absolute size-36 left-[8rem] bottom-[-2rem] md:visible invisible">
				<Image
					src="/svgs/pink-floop.svg"
					alt="Pink Floop"
					fill
					className="object-contain"
				/>
			</div>

			<div className="absolute size-48 right-[-1rem] top-[2.5rem] md:visible invisible">
				<Image
					src="/svgs/light-yellow-quarter-outline-circle.svg"
					alt="Light Yellow Quarter Outline Circle"
					fill
					className="object-contain"
				/>
			</div>
		</div>
	);
}
