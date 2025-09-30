"use client";

import Background from "@/features/templates/components/background";
import HelpCard from "@/features/templates/components/help-card";
import ListFilledTemplates from "@/features/templates/components/list-filled-templates";
import ListTemplates from "@/features/templates/components/list-templates";
import SendDialogButton from "@/features/templates/components/send-dialog-button";
import SendSheetButton from "@/features/templates/components/send-sheet-button";
import { useTemplatesStore } from "@/features/templates/stores/use-templates-store";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { cn } from "@/shared/lib/utils";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import Header from "../components/header";

export default function MainContainer() {
	const {
		order: { productVariants },
	} = useTemplatesStore();

	const searchParams = useSearchParams();
	const productVariantId = searchParams.get("productVariantId");

	const [selectedProductVariant, setSelectedProductVariant] = useState(
		productVariants.find((pv) => pv.id === productVariantId) ||
			productVariants[0],
	);

	const hasFillAllTemplates = useMemo(() => {
		if (productVariantId) {
			const pv = productVariants.find((pv) => pv.id === productVariantId);
			if (!pv) return false;
			return pv.templates.every((template) => template.dataURL);
		}

		return productVariants.every((productVariant) =>
			productVariant.templates.every((template) => template.dataURL),
		);
	}, [productVariants, productVariantId]);

	return (
		<section className="relative overflow-hidden min-h-dvh">
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
								if (productVariantId) {
									if (productVariant.id !== productVariantId) return;

									const countFilledTemplates = productVariant.templates.filter(
										(template) => template.dataURL,
									).length;
									const totalTemplates = productVariant.templates.length;

									return (
										<TabsTrigger
											key={productVariant.id}
											value={productVariant.id}
											className="data-[state=active]:bg-[#2854AD] data-[state=active]:text-white data-[state=active]:shadow-none text-xs font-medium text-[#98A2B3] rounded-sm px-3 py-1.5 transition-colors duration-200"
										>
											{productVariant.product.name} - {productVariant.name} (
											{countFilledTemplates}/{totalTemplates})
										</TabsTrigger>
									);
								}

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

				<div className="flex flex-col md:grid md:grid-cols-5 gap-6">
					{!hasFillAllTemplates && <HelpCard />}

					<div
						className={cn(
							"col-start-3 xl:col-start-2 col-end-6 bg-white rounded-xl px-6 py-5 space-y-4 flex flex-col h-fit",
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

							{hasFillAllTemplates && <SendDialogButton />}
						</div>

						{hasFillAllTemplates ? (
							<ListFilledTemplates
								selectedProductVariant={selectedProductVariant}
							/>
						) : (
							<ListTemplates selectedProductVariant={selectedProductVariant} />
						)}
					</div>
				</div>
			</main>

			{hasFillAllTemplates && (
				<div className="absolute inset-0 h-screen sm:hidden flex">
					<div className="fixed bottom-0 left-0 right-0 flex justify-center items-center p-4">
						<SendSheetButton />
					</div>
				</div>
			)}

			<Background />
		</section>
	);
}
