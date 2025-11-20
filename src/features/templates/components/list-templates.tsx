import TemplateLine from "@/features/editor/components/template-elements/template-line";
import TemplateShape from "@/features/editor/components/template-elements/template-shape";
import { Button } from "@/shared/components/ui/button";
import { getTemplateForSize } from "@/shared/lib/template";
import { cn } from "@/shared/lib/utils";
import { useGetTemplatesQuery } from "@/shared/repository/templates/query";
import type {
	OrderProductVariant,
	Product,
	ProductVariant,
	TemplateData,
} from "@/shared/types";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function ListTemplates({
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

	const firstEmptyTemplate = selectedProductVariant.templates.find(
		(template) => !template.dataURL,
	);

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
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2">
				{res?.data?.templates.map((template) => (
					<Link
						key={template.id}
						href={`/templates/${template.id}?orderProductVariantId=${firstEmptyTemplate?.id}`}
					>
						<div className="h-fit flex flex-col items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200 rounded-lg border">
							<div className="h-40 flex items-center justify-center">
								{template.previewUrl ? (
                  <Image
                    src={template.previewUrl}
                    alt={template.name}
                    width={160}
                    height={160}
                    className="object-contain h-40"
                  />
                ) : (
                  <span className="text-gray-500 p-2">No Preview Available</span>
                )}
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

			{/* Shapes */}
			{/* {scaledTemplate.shapes.map((shape) => (
				<TemplateShape
					key={shape.id}
					isPreview
					scale={scale}
					element={shape}
					isElementActive={false}
					toggleActive={() => {}}
					canvasWidth={scaledTemplate.width}
					canvasHeight={scaledTemplate.height}
				/>
			))} */}

			{/* Lines */}
			{/* {scaledTemplate.lines.map((line) => (
				<TemplateLine
					isPreview
					key={line.id}
					scale={scale}
					element={line}
					isElementActive={false}
					toggleActive={() => {}}
					canvasWidth={scaledTemplate.width}
					canvasHeight={scaledTemplate.height}
					onUpdate={() => {}}
				/>
			))} */}
		</div>
	);
};
