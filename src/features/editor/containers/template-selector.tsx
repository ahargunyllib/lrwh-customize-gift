"use client";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { getTemplateForSize } from "@/shared/lib/template";
import { useLogoutMutation } from "@/shared/repository/auth/query";
import { useSessionQuery } from "@/shared/repository/session-manager/query";
import { useGetTemplatesQuery } from "@/shared/repository/templates/query";
import type { TemplateData } from "@/shared/types/template";
import { PlusCircle, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import TemplateLine from "../components/template-elements/template-line";
import TemplateShape from "../components/template-elements/template-shape";

export default function TemplateSelector() {
	const router = useRouter();

	const searchParams = useSearchParams();
	const currentPage = Number(searchParams.get("page")) || 1;
	const [page, setPage] = useState(currentPage);

	// const [selectedSize, setSelectedSize] = useState(printSizes[1]);
	const { data: res, isLoading, error } = useGetTemplatesQuery({ page });
	const session = useSessionQuery();
	const { mutate: logout } = useLogoutMutation();

	const customTemplates = res?.data?.templates || [];
	const totalPages = res?.data?.pagination.total_page || 1;

	// Keep page in sync with URL
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("page", page.toString());
		router.push(`?${params.toString()}`);
	}, [page, router]);

	// const handleSizeChange = (size: string) => {
	// 	const newSize = printSizes.find((s) => s.name === size);
	// 	if (newSize) {
	// 		setSelectedSize(newSize);
	// 		document.dispatchEvent(
	// 			new CustomEvent("printSizeChange", {
	// 				detail: { size: newSize.name },
	// 			}),
	// 		);
	// 	}
	// };

	const handleTemplateSelect = (templateId: string) => {
		router.push(`/editor/${templateId}`);
	};

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

	return (
		<div className="container mx-auto py-8">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Select a Template</h1>
				<div className="flex items-center gap-4">
					{/* <div className="flex items-center gap-2">
						<span className="text-sm font-medium">Size:</span>
						<Select value={selectedSize.name} onValueChange={handleSizeChange}>
							<SelectTrigger className="w-32">
								<SelectValue placeholder="Select size" />
							</SelectTrigger>
							<SelectContent>
								{printSizes.map((size) => (
									<SelectItem key={size.name} value={size.name}>
										{size.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div> */}
					{session.data?.isLoggedIn && (
						<>
							<Link href="/editor/create">
								<Button variant="outline" className="flex items-center gap-2">
									<PlusCircle className="h-4 w-4" />
									Create New
								</Button>
							</Link>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										size="icon"
										className="rounded-full"
									>
										<UserRound />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="px-0">
									<DropdownMenuLabel>Hi, Admin</DropdownMenuLabel>
									<DropdownMenuItem className="rounded-none" asChild>
										<Link href="/dashboard/profile">Dashboard</Link>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className="text-red-600 hover:!text-red-700 font-medium rounded-none"
										onClick={() => {
											logout();
										}}
									>
										Logout
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{customTemplates.map((template) => (
					<Card key={template.id} className="overflow-hidden">
						<CardContent className="p-4">
							<div className="flex flex-col items-center gap-4">
								<div className="h-40 flex items-center justify-center">
									{renderTemplatePreview(template, {
										width: template.width,
										height: template.height,
									})}
								</div>
								<div className="w-full">
									<h3 className="text-lg font-medium mb-2">
										{template.name} (Custom)
									</h3>
									<Dialog>
										<DialogTrigger asChild>
											<Button className="w-full">Select Template</Button>
										</DialogTrigger>
										<DialogContent>
											<DialogHeader>
												<DialogTitle>Custom Template</DialogTitle>
											</DialogHeader>
											<div className="py-4">
												<p className="text-sm text-gray-500 mb-4">
													This is a custom template. You can edit it or use it
													as is.
												</p>
												<div className="flex gap-2">
													{session.data?.isLoggedIn && (
														<Button
															className="flex-1"
															variant="outline"
															onClick={() =>
																router.push(`/editor/${template.id}/edit`)
															}
														>
															Edit Template
														</Button>
													)}
													<Button
														className="flex-1"
														onClick={() => {
															router.push(`/editor/${template.id}`);
														}}
													>
														Use Template
													</Button>
												</div>
											</div>
										</DialogContent>
									</Dialog>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
			<div className="flex justify-center items-center gap-4 mt-8">
				<Button
					variant="outline"
					disabled={page <= 1}
					onClick={() => setPage((prev) => Math.max(1, prev - 1))}
				>
					Previous
				</Button>
				<span>
					Page {page} of {totalPages}
				</span>
				<Button
					variant="outline"
					disabled={page >= totalPages}
					onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
				>
					Next
				</Button>
			</div>
		</div>
	);
}
