"use client";

import { useTemplatesStore } from "@/features/templates/stores/use-templates-store";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { Button } from "@/shared/components/ui/button";
import {
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import {
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/shared/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useDialogStore } from "@/shared/hooks/use-dialog";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useSheetStore } from "@/shared/hooks/use-sheet";
import { getTemplateForSize } from "@/shared/lib/template";
import { cn } from "@/shared/lib/utils";
import { useSubmitOrderMutation } from "@/shared/repository/order/query";
import { useGetTemplatesQuery } from "@/shared/repository/templates/query";
import type {
	OrderProductVariant,
	Product,
	ProductVariant,
	TemplateData,
} from "@/shared/types";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	LoaderIcon,
	SendIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function Page() {
	const {
		order: { id, productVariants },
		deleteDataURLTemplate,
		deleteOrder,
	} = useTemplatesStore();

	const [selectedProductVariant, setSelectedProductVariant] = useState(
		productVariants[0],
	);

	const hasFillAllTemplates = useMemo(() => {
		return productVariants.every((productVariant) =>
			productVariant.templates.every((template) => template.dataURL),
		);
	}, [productVariants]);

	const { mutate: submitOrder, isPending } = useSubmitOrderMutation();
	const router = useRouter();
	const { openDialog, closeDialog } = useDialogStore();
	const { openSheet, closeSheet } = useSheetStore();
	const isMobile = useIsMobile();

	const onSubmitHandler = () => {
		const templates = [];
		for (const productVariant of productVariants) {
			for (const template of productVariant.templates) {
				if (template.dataURL) {
					templates.push({
						orderProductVariantId: template.id,
						dataURL: template.dataURL,
					});
				}
			}
		}
		submitOrder(
			{
				orderId: id,
				templates,
			},
			{
				onSuccess: (res) => {
					closeDialog();
					if (!res.success) {
						toast.error("Gagal mengirim template, silakan coba lagi.", {
							description: res.message || "Terjadi kesalahan",
						});
						return;
					}

					toast.success("Template berhasil dikirim!");
					deleteOrder();
					router.replace("/templates/onboarding");
				},
			},
		);
	};

	return (
		<section className="relative">
			<Header />

			<main className="px-6 md:px-14 py-6 flex flex-col gap-6">
				<div className="space-y-3">
					<div className="space-y-1">
						<h2 className="text-xs font-bold text-[#090E17]">
							PRODUK YANG KAMU BELI
						</h2>
						<span className="text-[#475467] text-xs">
							Pilih produk yang kamu ingin edit dulu
						</span>
					</div>

					<Tabs
						value={selectedProductVariant.id}
						onValueChange={(value) => {
							setSelectedProductVariant(
								productVariants.find(
									(productVariant) => productVariant.id === value,
								) || productVariants[0],
							);
						}}
						className="overflow-auto"
					>
						<TabsList className="bg-white text-[#98A2B3] rounded-md p-1 h-fit space-x-2">
							{productVariants.map((productVariant) => {
								const countFilledTemplates = productVariant.templates.filter(
									(template) => template.dataURL,
								).length;
								const totalTemplates = productVariant.templates.length;

								return (
									<TabsTrigger
										key={productVariant.id}
										value={productVariant.id}
										className="data-[state=active]:bg-[#2854AD] data-[state=active]:text-white data-[state=active]:shadow-none text-xs font-medium text-[#98A2B3] rounded-sm px-3 py-1.5 transition-colors duration-200"
										disabled={
											countFilledTemplates === totalTemplates &&
											!hasFillAllTemplates
										}
									>
										{productVariant.product.name} - {productVariant.name} (
										{countFilledTemplates}/{totalTemplates})
									</TabsTrigger>
								);
							})}
						</TabsList>
					</Tabs>
				</div>

				<div className="flex flex-col md:grid md:grid-cols-5 md:grid-rows-5 gap-6">
					{!hasFillAllTemplates && <HelpCard />}

					<div
						className={cn(
							"col-start-3 xl:col-start-2 col-end-6 row-start-1 row-end-8 bg-white rounded-xl px-6 py-5 space-y-4 flex flex-col",
							hasFillAllTemplates ? "col-start-1 xl:col-start-1" : "",
						)}
					>
						<div className="flex flex-row items-center justify-between">
							<div className="space-y-2">
								<h2 className="font-bold text-[#1D2939]">
									{hasFillAllTemplates ? "Template Photo" : "Template"}
								</h2>
								<span className="text-xs text-[#475467]">
									{hasFillAllTemplates ? (
										"Preview semua template kamu yang kamu edit"
									) : (
										<>
											Pilih template yang kamu inginkan untuk{" "}
											<b>
												{selectedProductVariant.product.name} -{" "}
												{selectedProductVariant.name}
											</b>
										</>
									)}
								</span>
							</div>

							{hasFillAllTemplates && (
								<Button
									className="gap-2 font-medium text-xs text-white bg-black px-4 py-3 rounded-md h-fit hidden sm:flex"
									onClick={() => {
										openDialog({
											children: (
												<DialogContent
													showCloseButton={false}
													className="sm:max-w-sm"
												>
													<div className="relative size-48 w-full">
														<Image
															src="/svgs/success-1.svg"
															alt="Success"
															fill
															objectFit="contain"
														/>
													</div>
													<DialogHeader className="gap-4 sm:text-center">
														<DialogTitle className="text-center text-[#1D2939] font-bold">
															Konfirmasi template pemesanan
														</DialogTitle>
														<DialogDescription className="text-center text-[#737373] text-sm">
															Apakah kamu yakin templatenya sudah cocok? kalo
															udah oke bisa kirim ke kami dan tunggu pesanan
															kamu sampe yaa
														</DialogDescription>
													</DialogHeader>
													<DialogFooter className="flex flex-row gap-2">
														<Button
															variant="secondary"
															className="flex-1 px-8 py-4 h-fit bg-[#F2F4F7] hover:bg-[#dcdcdf] rounded-md shadow-none text-base font-bold text-[#344054]"
															onClick={() => closeDialog()}
														>
															Kembali
														</Button>
														<Button
															onClick={() => onSubmitHandler()}
															className="flex-1 px-8 py-4 h-fit bg-[#2854AD] hover:bg-[#2854AD]/80 rounded-md shadow-none text-base font-bold text-[#ffffff]"
														>
															{isPending ? (
																<>
																	<LoaderIcon className="animate-spin" />
																	Mengirim...
																</>
															) : (
																<>Kirim</>
															)}
														</Button>
													</DialogFooter>
												</DialogContent>
											),
										});
									}}
								>
									Kirim Template <SendIcon />
								</Button>
							)}
						</div>

						{hasFillAllTemplates ? (
							<div className="flex flex-row flex-wrap grow gap-2">
								{selectedProductVariant.templates.map((template) => (
									<div
										key={template.id}
										className="flex flex-col gap-2 items-center"
									>
										<img
											src={
												template.dataURL || "https://placekitten.com/300/200"
											}
											alt="Template Preview"
											className="size-40 object-contain rounded-lg border"
										/>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												if (isMobile) {
													openSheet({
														children: (
															<SheetContent side="bottom">
																<div className="relative size-48 w-full">
																	<Image
																		src="/svgs/warning-1.svg"
																		alt="Warning"
																		fill
																		objectFit="contain"
																	/>
																</div>
																<SheetHeader className="gap-4 sm:text-center">
																	<SheetTitle className="text-center text-[#1D2939] font-bold">
																		Konfirmasi hapus template
																	</SheetTitle>
																	<SheetDescription className="text-center text-[#737373] text-sm">
																		Apakah kamu yakin ingin menghapus template
																		yang sudah kamu pilih dan edit? Kalau
																		dihapus, perlu mulai dari awal lagi
																	</SheetDescription>
																</SheetHeader>
																<SheetFooter className="flex flex-row gap-2">
																	<Button
																		variant="secondary"
																		className="flex-1 px-8 py-4 h-fit bg-[#F2F4F7] hover:bg-[#dcdcdf] rounded-md shadow-none text-base font-bold text-[#344054]"
																		onClick={() => closeSheet()}
																	>
																		Batal
																	</Button>
																	<Button
																		onClick={() =>
																			deleteDataURLTemplate(template.id)
																		}
																		className="flex-1 px-8 py-4 h-fit bg-[#DC2625] hover:bg-[#DC2625]/80 rounded-md shadow-none text-base font-bold text-[#ffffff]"
																	>
																		Hapus template
																	</Button>
																</SheetFooter>
															</SheetContent>
														),
													});
													return;
												}

												openDialog({
													children: (
														<DialogContent
															showCloseButton={false}
															className="sm:max-w-sm"
														>
															<div className="relative size-48 w-full">
																<Image
																	src="/svgs/warning-1.svg"
																	alt="Warning"
																	fill
																	objectFit="contain"
																/>
															</div>
															<DialogHeader className="gap-4 sm:text-center">
																<DialogTitle className="text-center text-[#1D2939] font-bold">
																	Konfirmasi hapus template
																</DialogTitle>
																<DialogDescription className="text-center text-[#737373] text-sm">
																	Apakah kamu yakin ingin menghapus template
																	yang sudah kamu pilih dan edit? Kalau dihapus,
																	perlu memulai dari awal lagi
																</DialogDescription>
															</DialogHeader>
															<DialogFooter className="flex flex-row gap-2">
																<Button
																	variant="secondary"
																	className="flex-1 px-8 py-4 h-fit bg-[#F2F4F7] hover:bg-[#dcdcdf] rounded-md shadow-none text-base font-bold text-[#344054]"
																	onClick={() => closeDialog()}
																>
																	Batal
																</Button>
																<Button
																	onClick={() =>
																		deleteDataURLTemplate(template.id)
																	}
																	className="flex-1 px-8 py-4 h-fit bg-[#DC2625] hover:bg-[#DC2625]/80 rounded-md shadow-none text-base font-bold text-[#ffffff]"
																>
																	Hapus template
																</Button>
															</DialogFooter>
														</DialogContent>
													),
												});
											}}
											className="text-destructive hover:text-destructive font-semibold hover:font-bold w-full"
										>
											Hapus
										</Button>
									</div>
								))}
							</div>
						) : (
							<ListTemplates selectedProductVariant={selectedProductVariant} />
						)}
					</div>
				</div>
			</main>

			{hasFillAllTemplates && (
				<div className="absolute inset-0 h-screen">
					<div className="fixed bottom-0 left-0 right-0 flex justify-center items-center p-4">
						<Button
							size="lg"
							className="gap-2 font-medium text-xs text-white bg-black px-4 py-3 rounded-md h-fit sm:hidden flex w-full"
							onClick={() => {
								openSheet({
									children: (
										<SheetContent side="bottom">
											<div className="relative size-48 w-full">
												<Image
													src="/svgs/success-1.svg"
													alt="Success"
													fill
													objectFit="contain"
												/>
											</div>
											<SheetHeader className="gap-4 sm:text-center">
												<SheetTitle className="text-center text-[#1D2939] font-bold">
													Konfirmasi template pemesanan
												</SheetTitle>
												<SheetDescription className="text-center text-[#737373] text-sm">
													Apakah kamu yakin templatenya sudah cocok? kalo udah
													oke bisa kirim ke kami dan tunggu pesanan kamu sampe
													yaa
												</SheetDescription>
											</SheetHeader>
											<SheetFooter className="flex flex-row gap-2">
												<Button
													variant="secondary"
													className="flex-1 px-8 py-4 h-fit bg-[#F2F4F7] hover:bg-[#dcdcdf] rounded-md shadow-none text-base font-bold text-[#344054]"
													onClick={() => closeSheet()}
												>
													Kembali
												</Button>
												<Button
													onClick={() => onSubmitHandler()}
													className="flex-1 px-8 py-4 h-fit bg-[#2854AD] hover:bg-[#2854AD]/80 rounded-md shadow-none text-base font-bold text-[#ffffff]"
												>
													{isPending ? (
														<>
															<LoaderIcon className="animate-spin" />
															Mengirim...
														</>
													) : (
														<>Kirim</>
													)}
												</Button>
											</SheetFooter>
										</SheetContent>
									),
								});
							}}
						>
							Kirim Template <SendIcon />
						</Button>
					</div>
				</div>
			)}

			<Background />
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

function Background() {
	return (
		<div className="absolute top-0 left-0 inset-0 min-h-screen bg-[#F2F4F7] w-screen z-[-1] overflow-hidden">
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

function Header() {
	const {
		order: { username, orderNumber },
	} = useTemplatesStore();

	return (
		<header className="bg-white px-6 md:px-14 py-4 space-y-1 border-b border-[#F2F4F7]">
			<h1 className="text-xl font-medium">Hai, {username}!</h1>
			<p className="text-xs text-[#98A2B3]">Order ID : {orderNumber}</p>
		</header>
	);
}

function HelpCard() {
	const isMobile = useIsMobile();

	return isMobile ? (
		<Accordion
			type="single"
			className="w-full"
			collapsible
			defaultValue="informasi-pengisian-template"
		>
			<AccordionItem
				value="informasi-pengisian-template"
				className="bg-white rounded-xl p-3 space-y-4"
			>
				<AccordionTrigger className="p-0">
					<h2 className="text-sm font-bold text-[#1D2939]">
						Informasi Pengisian Template
					</h2>
				</AccordionTrigger>

				<AccordionContent>
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
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	) : (
		<div className="col-start-1 col-end-3 xl:col-end-2 row-start-1 row-end-6 bg-white rounded-xl px-6 py-5 space-y-4">
			<h2 className="text-sm font-bold text-[#1D2939]">
				Informasi Pengisian Template
			</h2>

			<ol className="list-decimal list-inside text-sm text-[#090E17] space-y-2">
				<li>
					<b>Pilih dulu tab produk di atas </b>
					<br />
					Misalnya kamu ingin pesan photocard dan figura, cukup pilih salah satu
					dulu untuk mulai atur templatenya, ya!
				</li>
				<li>
					<b>Pilih template yang kamu suka</b>
					<br />
					Scroll dan temukan desain yang paling cocok dengan vibe kamu ✨
				</li>
				<li>
					<b>Edit template sesukamu</b>
					<br />
					Tambahkan nama, ucapan, bentuk lucu, atau foto kenangan—bebas kreasi!
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
					Kami akan proses dan pastikan hasilnya sesuai dengan yang kamu mau! 🎁
				</li>
			</ol>
		</div>
	);
}

function ListTemplates({
	selectedProductVariant,
}: {
	selectedProductVariant: {
		id: ProductVariant["id"];
		name: ProductVariant["name"];
		product: {
			id: Product["id"];
			name: Product["name"];
		};
		templates: {
			id: OrderProductVariant["id"];
			dataURL: string | null;
		}[];
	};
}) {
	const searchParams = useSearchParams();

	const [query, setQuery] = useState({
		page: searchParams.get("page") || "1",
	});

	const { data: res, isLoading } = useGetTemplatesQuery({
		productVariantId: selectedProductVariant.id,
		page: Number.parseInt(query.page),
	});

	const firstEmptyTemplate = useMemo(() => {
		return (
			selectedProductVariant.templates.find((template) => !template.dataURL) ||
			selectedProductVariant.templates[
				selectedProductVariant.templates.length - 1
			]
		);
	}, [selectedProductVariant.templates]);

	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		const urlSearchParams = new URLSearchParams(searchParams);
		urlSearchParams.set("page", query.page);

		if (urlSearchParams.size === 0) {
			router.replace(pathname);
		} else {
			router.replace(`${pathname}?${urlSearchParams.toString()}`);
		}
	}, [query, pathname, router, searchParams]);

	useEffect(() => {
		const urlSearchParams = new URLSearchParams(searchParams);
		urlSearchParams.set("page", "1");

		router.replace(`${pathname}?${urlSearchParams.toString()}`);
	}, [pathname, router, searchParams]);

	return (
		<>
			<div className="flex flex-row flex-wrap grow gap-2">
				{res?.data?.templates.map((template) => (
					<Link
						key={template.id}
						href={`/templates/${template.id}?orderProductVariantId=${firstEmptyTemplate.id}`}
					>
						<div className="h-fit flex flex-col items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200 rounded-lg">
							<div className="h-40 flex items-center justify-center">
								{renderTemplatePreview(template, {
									width: template.width,
									height: template.height,
								})}
							</div>
							<h3 className="text-xs font-medium mb-2">{template.name}</h3>
						</div>
					</Link>
				))}
			</div>
			{!isLoading && res && res.success && res.data && (
				<div className="flex justify-center items-center gap-2">
					<Button
						size="icon"
						variant="ghost"
						onClick={() => {
							setQuery((prev) => ({
								...prev,
								page: String(Math.max(Number.parseInt(prev.page) - 1, 1)),
							}));
						}}
						disabled={res.data.pagination.page === 1}
					>
						<ChevronLeftIcon
							className={cn(
								res.data.pagination.page !== 1
									? "text-black"
									: "text-[#BFBFBF]",
							)}
						/>
					</Button>
					{Array.from({
						length: res.data.pagination.total_page,
					}).map((_, index) => (
						<Button
							// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
							key={index}
							size="icon"
							variant="ghost"
							className={cn(
								"text-xs font-semibold",
								res.data.pagination.page === index + 1
									? "text-black"
									: "text-[#BFBFBF]",
							)}
							disabled={res.data.pagination.page === index + 1}
							onClick={() => {
								setQuery((prev) => ({
									...prev,
									page: String(index + 1),
								}));
							}}
						>
							{index + 1}
						</Button>
					))}
					<Button
						size="icon"
						variant="ghost"
						onClick={() => {
							setQuery((prev) => ({
								...prev,
								page: String(
									Math.min(
										Number.parseInt(prev.page) + 1,
										res.data.pagination.total_page,
									),
								),
							}));
						}}
						disabled={
							res.data.pagination.page === res.data.pagination.total_page
						}
					>
						<ChevronRightIcon
							className={cn(
								res.data.pagination.page !== res.data.pagination.total_page
									? "text-black"
									: "text-[#BFBFBF]",
							)}
						/>
					</Button>
				</div>
			)}
		</>
	);
}
