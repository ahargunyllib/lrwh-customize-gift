"use client";

import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { getTemplateForSize } from "@/shared/lib/template";
import { cn } from "@/shared/lib/utils";
import { useGetTemplatesQuery } from "@/shared/repository/templates/query";
import type { Pagination, TemplateData } from "@/shared/types";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function Page() {
	const [selectedTab, setSelectedTab] = useState("account");

	const tabs = [
		{ value: "account", label: "Account" },
		{ value: "password", label: "Password" },
		{
			value: "notifications",
			label: "Notifications",
		},
		{
			value: "security",
			label: "Security",
		},
	];

	const { data: res, isLoading } = useGetTemplatesQuery();

	const pagination: Pagination = {
		page: 1,
		limit: 10,
		total_data: 20,
		total_page: 2,
	};

	return (
		<section className="">
			<header className="bg-white px-14 py-4 space-y-1 border-b border-[#F2F4F7]">
				<h1 className="text-xl font-medium">Hai (username)</h1>
				<p className="text-xs text-[#98A2B3]">Order ID : #250720KVFJ741R</p>
			</header>
			<main className="px-14 py-6 grid grid-cols-5 grid-rows-7 gap-6">
				<div className="col-start-1 col-end-6 row-start-1 row-end-2 space-y-3">
					<div className="space-y-1">
						<h2 className="text-xs font-bold text-[#090E17]">
							PRODUK YANG KAMU BELI
						</h2>
						<span className="text-[#475467] text-xs">
							Pilih produk yang kamu ingin edit dulu
						</span>
					</div>

					<Tabs
						defaultValue="account"
						value={selectedTab}
						onValueChange={setSelectedTab}
					>
						<TabsList className="bg-white text-[#98A2B3] rounded-md p-1 h-fit space-x-2">
							{tabs.map((tab) => (
								<TabsTrigger
									key={tab.value}
									value={tab.value}
									className="data-[state=active]:bg-[#2854AD] data-[state=active]:text-white data-[state=active]:shadow-none text-xs font-medium text-[#98A2B3] rounded-sm px-3 py-1.5 transition-colors duration-200"
								>
									{tab.label}
								</TabsTrigger>
							))}
						</TabsList>
					</Tabs>
				</div>

				<div className="col-start-1 col-end-2 row-start-2 row-end-7 bg-white rounded-xl px-6 py-5 space-y-4">
					<h2 className="text-sm font-bold text-[#1D2939]">
						Informasi Pengisian Template
					</h2>

					<ol className="list-decimal list-inside text-sm text-[#090E17] space-y-2">
						<li>
							<b>Pilih dulu tab produk di atas </b>
							<br />
							Misalnya kamu ingin pesan photocard dan figura, cukup pilih salah
							satu dulu untuk mulai atur templatenya, ya!
						</li>
						<li>
							<b>Pilih template yang kamu suka</b>
							<br />
							Scroll dan temukan desain yang paling cocok dengan vibe kamu ✨
						</li>
						<li>
							<b>Edit template sesukamu</b>
							<br />
							Tambahkan nama, ucapan, bentuk lucu, atau foto kenangan—bebas
							kreasi!
						</li>
						<li>
							<b>Klik "Simpan" dan lihat hasilnya</b>
							<br />
							Nanti akan muncul preview dari template yang sudah kamu edit.
						</li>
						<li>
							<b>Kalau sudah oke, lanjut ke produk lainnya </b>
							<br />
							Ulangi langkahnya untuk produk kedua (kalau kamu beli lebih dari
							satu).
						</li>
						<li>
							<b>Terakhir, kirim ke kami</b>
							<br />
							Kami akan proses dan pastikan hasilnya sesuai dengan yang kamu
							mau! 🎁
						</li>
					</ol>
				</div>

				<div className="col-start-2 col-end-6 row-start-2 row-end-8 bg-white rounded-xl px-6 py-5 space-y-4 flex flex-col">
					<div className="space-y-2">
						<h2 className="font-bold text-[#1D2939]">Template</h2>
						<span className="text-xs text-[#475467]">
							Pilih template yang kamu inginkan untuk {selectedTab}
						</span>
					</div>

					<div className="flex flex-row flex-wrap grow gap-2 ">
						{res?.data?.templates.map((template) => (
							<div
								key={template.id}
								className="h-fit flex flex-col items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200 rounded-lg"
							>
								<div className="h-40 flex items-center justify-center">
									{renderTemplatePreview(template, {
										width: template.width,
										height: template.height,
									})}
								</div>
								<h3 className="text-xs font-medium mb-2">{template.name}</h3>
							</div>
						))}
					</div>

					<div className="flex justify-center items-center gap-2">
						<Button
							size="icon"
							variant="ghost"
							onClick={() => {
								// Handle previous page logic here
							}}
							disabled={pagination.page === 1}
						>
							<ChevronLeftIcon
								className={cn(
									pagination.page !== 1 ? "text-black" : "text-[#BFBFBF]",
								)}
							/>
						</Button>
						{Array.from({ length: pagination.total_page }).map((_, index) => (
							<Button
								// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
								key={index}
								size="icon"
								variant="ghost"
								className={cn(
									"text-xs font-semibold",
									pagination.page === index + 1
										? "text-black"
										: "text-[#BFBFBF]",
								)}
								disabled={pagination.page === index + 1}
								onClick={() => {
									// Handle page change logic here
									// For example, setPagination({ ...pagination, page: index + 1 });
								}}
							>
								{index + 1}
							</Button>
						))}
						<Button
							size="icon"
							variant="ghost"
							onClick={() => {
								// Handle previous page logic here
							}}
							disabled={pagination.page === pagination.total_page}
						>
							<ChevronRightIcon
								className={cn(
									pagination.page !== pagination.total_page
										? "text-black"
										: "text-[#BFBFBF]",
								)}
							/>
						</Button>
					</div>
				</div>
			</main>

			<div className="absolute top-0 left-0 min-h-dvh bg-[#F2F4F7] w-screen z-[-1] overflow-hidden">
				<div className="absolute size-30 left-[18.5rem] top-[10.5rem]">
					<Image
						src="/svgs/peach-flower.svg"
						alt="Peach Flower"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-36 left-[8rem] bottom-[-2rem]">
					<Image
						src="/svgs/pink-floop.svg"
						alt="Pink Floop"
						fill
						className="object-contain"
					/>
				</div>

				<div className="absolute size-48 right-[-1rem] top-[2.5rem]">
					<Image
						src="/svgs/light-yellow-quarter-outline-circle.svg"
						alt="Light Yellow Quarter Outline Circle"
						fill
						className="object-contain"
					/>
				</div>
			</div>
		</section>
	);
}

const renderTemplatePreview = (
	template: TemplateData,
	size: {
		width: number;
		height: number;
	},
) => {
	const scaledTemplate = getTemplateForSize(template, size);
	const scale = 0.2; // Preview scale

	return (
		<div
			className="relative bg-white shadow-md overflow-hidden"
			style={{
				width: scaledTemplate.width * scale,
				height: scaledTemplate.height * scale,
			}}
		>
			{/* Background */}
			<div
				className="absolute inset-0"
				style={{
					backgroundColor: scaledTemplate.backgroundColor,
					backgroundImage: scaledTemplate.backgroundImage
						? `url(${scaledTemplate.backgroundImage})`
						: undefined,
					backgroundSize: "cover",
					backgroundPosition: "center",
				}}
			/>

			{/* Images */}
			{scaledTemplate.images.map((image) => (
				<div
					key={image.id}
					className="absolute"
					style={{
						left: image.position.x * scale,
						top: image.position.y * scale,
						width: image.width * scale,
						height: image.height * scale,
					}}
				>
					<img
						src={image.src || "https://placecats.com/300/200"}
						alt="Template element"
						className="w-full h-full object-cover"
					/>
				</div>
			))}

			{/* Simplified text representation */}
			{scaledTemplate.texts.map((text) => (
				<div
					key={text.id}
					className="absolute bg-gray-200"
					style={{
						left: text.position.x * scale,
						top: text.position.y * scale,
						width: 50 * scale,
						height: 10 * scale,
					}}
				/>
			))}
		</div>
	);
};
