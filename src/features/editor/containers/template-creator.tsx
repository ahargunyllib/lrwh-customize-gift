"use client";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Textarea } from "@/shared/components/ui/textarea";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { printSizes, scaleTemplate } from "@/shared/lib/template";
import type {
	ImageElement,
	TemplateData,
	TextElement,
} from "@/shared/types/template";
import {
	ArrowLeft,
	ImagePlus,
	Layout,
	Menu,
	Save,
	Trash2,
	Type,
	X,
} from "lucide-react";
import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import EditorCanvas from "../components/editor-canvas";
import ElementControls from "../components/template-elements/element-controls";
import { getTemplateById } from "../services";

export default function TemplateCreator({
	templateId,
}: { templateId?: string }) {
	const isMobile = useIsMobile();
	const [template, setTemplate] = useState<TemplateData>({
		id: uuidv4(),
		name: "Custom Template",
		width: printSizes[1].width,
		height: printSizes[1].height,
		backgroundColor: "#ffffff",
		images: [],
		texts: [],
	});
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [templateName, setTemplateName] = useState(template.name);
	const [backgroundColor, setBackgroundColor] = useState(
		template.backgroundColor,
	);
	const [selectedSize, setSelectedSize] = useState(
		printSizes.find(
			(s) => s.width === template.width && s.height === template.height,
		) ?? printSizes[1],
	);

	const [activeElement, setActiveElement] = useState<string | null>(null);
	const [scale, setScale] = useState(1);
	const canvasRef = useRef<HTMLDivElement>(null);
	const canvasContainerRef = useRef<HTMLDivElement>(null);

	const activeImage = activeElement
		? template.images.find((img) => img.id === activeElement)
		: null;
	const activeText = activeElement
		? template.texts.find((txt) => txt.id === activeElement)
		: null;

	const toggleSidebar = () => {
		setSidebarOpen(!sidebarOpen);
	};

	useEffect(() => {
		if (!templateId) return;

		const data = getTemplateById(templateId);
		if (!data) return;

		setTemplate(data);

		setTemplateName(data.name);
		setBackgroundColor(data.backgroundColor);

		const size = printSizes.find(
			(s) => s.width === data.width && s.height === data.height,
		);
		if (size) setSelectedSize(size);
	}, [templateId]);

	useEffect(() => {
		setTemplate((prev) => ({
			...prev,
			name: templateName,
			backgroundColor,
		}));
	}, [templateName, backgroundColor]);

	useEffect(() => {
		setTemplate((prev) => ({
			...prev,
			name: templateName,
			backgroundColor: backgroundColor,
		}));
	}, [templateName, backgroundColor]);

	const handleSizeChange = (size: string) => {
		const newSize = printSizes.find((s) => s.name === size);
		if (newSize) {
			setSelectedSize(newSize);
			setTemplate((prev) => scaleTemplate(prev, newSize));
		}
	};

	useEffect(() => {
		const updateScale = () => {
			if (canvasContainerRef.current) {
				const containerWidth = canvasContainerRef.current.clientWidth - 32;
				const templateWidth = template.width;
				const newScale = Math.min(1, containerWidth / templateWidth);
				setScale(newScale);
			}
		};

		updateScale();
		window.addEventListener("resize", updateScale);
		return () => window.removeEventListener("resize", updateScale);
	}, [template.width]);

	const addImageElement = () => {
		const newImage: ImageElement = {
			id: uuidv4(),
			type: "image",
			src: "/placeholder.png",
			position: { x: template.width / 2 - 100, y: template.height / 2 - 100 },
			width: 200,
			height: 200,
			draggable: true,
		};

		setTemplate((prev) => ({
			...prev,
			images: [...prev.images, newImage],
		}));

		setActiveElement(newImage.id);
	};

	const addTextElement = () => {
		const newText: TextElement = {
			id: uuidv4(),
			type: "text",
			content: "New Text",
			position: { x: template.width / 2 - 100, y: template.height / 2 },
			draggable: true,
			style: {
				fontFamily: "Arial, sans-serif",
				fontSize: "24px",
				fontWeight: "normal",
				color: "#000000",
				textAlign: "center",
				lineHeight: "1.2",
			},
		};

		setTemplate((prev) => ({
			...prev,
			texts: [...prev.texts, newText],
		}));

		setActiveElement(newText.id);
	};

	const handleImageUpload = (id: string, file: File) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			if (e.target?.result) {
				setTemplate((prev) => ({
					...prev,
					images: prev.images.map((img) =>
						img.id === id ? { ...img, src: e.target?.result as string } : img,
					),
				}));
			}
		};
		reader.readAsDataURL(file);
	};

	const handleTextChange = (id: string, value: string) => {
		setTemplate((prev) => ({
			...prev,
			texts: prev.texts.map((text) =>
				text.id === id ? { ...text, content: value } : text,
			),
		}));
	};

	const handleTextStyleChange = (
		id: string,
		property: string,
		value: string,
	) => {
		setTemplate((prev) => ({
			...prev,
			texts: prev.texts.map((text) =>
				text.id === id
					? { ...text, style: { ...text.style, [property]: value } }
					: text,
			),
		}));
	};

	const deleteActiveElement = () => {
		if (!activeElement) return;

		setTemplate((prev) => {
			const imageIndex = prev.images.findIndex(
				(img) => img.id === activeElement,
			);
			if (imageIndex >= 0) {
				const newImages = [...prev.images];
				newImages.splice(imageIndex, 1);
				return { ...prev, images: newImages };
			}

			const textIndex = prev.texts.findIndex((txt) => txt.id === activeElement);
			if (textIndex >= 0) {
				const newTexts = [...prev.texts];
				newTexts.splice(textIndex, 1);
				return { ...prev, texts: newTexts };
			}

			return prev;
		});

		setActiveElement(null);
	};

	const saveTemplate = () => {
		const savedTemplates = JSON.parse(
			localStorage.getItem("customTemplates") || "[]",
		);
		const templateToSave = {
			...template,
			name: templateName,
		};

		const existingIndex = savedTemplates.findIndex(
			(t: TemplateData) => t.id === template.id,
		);

		if (existingIndex !== -1) {
			savedTemplates[existingIndex] = templateToSave;
		} else {
			savedTemplates.push(templateToSave);
		}

		localStorage.setItem("customTemplates", JSON.stringify(savedTemplates));

		alert("Template saved successfully!");
	};

	const centerActiveElement = (axis: "x" | "y" | "both") => {
		if (!activeElement) return;

		const activeImage = template.images.find((img) => img.id === activeElement);
		const activeText = template.texts.find((txt) => txt.id === activeElement);

		if (!activeImage && !activeText) return;

		document.dispatchEvent(
			new CustomEvent("elementCenter", {
				detail: {
					id: activeElement,
					type: activeImage ? "image" : "text",
					axis,
				},
			}),
		);
	};

	return (
		<div className="flex h-screen flex-col">
			<header className="border-b bg-white">
				<div className="container flex items-center justify-between py-3">
					<div className="flex items-center gap-2 md:gap-4">
						{isMobile && (
							<Button variant="ghost" size="icon" onClick={toggleSidebar}>
								<Menu className="h-5 w-5" />
							</Button>
						)}
						<Link href="/templates">
							<Button variant="ghost" size="icon">
								<ArrowLeft className="h-5 w-5" />
							</Button>
						</Link>
						<h1 className="text-lg md:text-xl font-bold truncate">
							Create New Template
						</h1>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="outline" size="sm" onClick={saveTemplate}>
							<Save className="mr-2 h-4 w-4" />
							<span className="hidden sm:inline">Save Template</span>
							<span className="sm:hidden">Save</span>
						</Button>
					</div>
				</div>
			</header>

			<div className="flex flex-1 overflow-hidden relative">
				{/* Mobile Sidebar Overlay */}
				{isMobile && sidebarOpen && (
					// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
					<div
						className="fixed inset-0 bg-black/20 z-10"
						onClick={() => setSidebarOpen(false)}
					/>
				)}

				{/* Left Sidebar */}
				<div
					className={`${
						isMobile
							? `fixed left-0 top-0 bottom-0 z-20 w-72 transform transition-transform duration-300 ease-in-out ${
									sidebarOpen ? "translate-x-0" : "-translate-x-full"
								}`
							: "w-64 border-r"
					} bg-gray-50 p-4 overflow-y-auto`}
				>
					{isMobile && (
						<div className="flex justify-between items-center mb-4">
							<h2 className="font-semibold">Template Editor</h2>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setSidebarOpen(false)}
							>
								<X className="h-5 w-5" />
							</Button>
						</div>
					)}

					<Tabs defaultValue="settings">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="settings">
								<Layout className="h-4 w-4 mr-2" />
								Settings
							</TabsTrigger>
							<TabsTrigger value="images">
								<ImagePlus className="h-4 w-4 mr-2" />
								Images
							</TabsTrigger>
							<TabsTrigger value="text">
								<Type className="h-4 w-4 mr-2" />
								Text
							</TabsTrigger>
						</TabsList>

						{/* Settings Tab */}
						<TabsContent value="settings" className="space-y-4 mt-4">
							<div className="space-y-2">
								<Label htmlFor="template-name">Template Name</Label>
								<Input
									id="template-name"
									value={templateName}
									onChange={(e) => setTemplateName(e.target.value)}
									placeholder="Enter template name"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="print-size">Print Size</Label>
								<Select
									value={selectedSize.name}
									onValueChange={handleSizeChange}
								>
									<SelectTrigger id="print-size">
										<SelectValue placeholder="Size" />
									</SelectTrigger>
									<SelectContent>
										{printSizes.map((size) => (
											<SelectItem key={size.name} value={size.name}>
												{size.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="background-color">Background Color</Label>
								<div className="flex gap-2">
									<input
										type="color"
										id="background-color"
										value={backgroundColor}
										onChange={(e) => setBackgroundColor(e.target.value)}
										className="w-10 h-10 p-0 border rounded"
									/>
									<Input
										value={backgroundColor}
										onChange={(e) => setBackgroundColor(e.target.value)}
										placeholder="#FFFFFF"
										className="flex-1"
									/>
								</div>
							</div>

							{activeElement && (
								<>
									<div className="mt-4">
										<Label className="text-sm">Quick Alignment</Label>
										<ElementControls
											onCenterX={() => centerActiveElement("x")}
											onCenterY={() => centerActiveElement("y")}
											onCenterBoth={() => centerActiveElement("both")}
										/>
									</div>

									<Button
										variant="destructive"
										size="sm"
										onClick={deleteActiveElement}
										className="mt-4 w-full"
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Delete Selected Element
									</Button>
								</>
							)}
						</TabsContent>

						{/* Images Tab */}
						<TabsContent value="images" className="space-y-4 mt-4">
							<Button onClick={addImageElement} className="w-full">
								<ImagePlus className="mr-2 h-4 w-4" />
								Add Image
							</Button>

							<div className="space-y-3 mt-4">
								{template.images.map((image) => (
									<Card
										key={image.id}
										className={`overflow-hidden cursor-pointer ${
											activeElement === image.id ? "ring-2 ring-primary" : ""
										}`}
										onClick={() => setActiveElement(image.id)}
									>
										<CardContent className="p-2">
											<div className="flex items-center gap-2">
												<div className="h-16 w-16 overflow-hidden rounded border">
													<img
														src={image.src || "/placeholder.svg"}
														// biome-ignore lint/a11y/noRedundantAlt: <explanation>
														alt="Template image"
														className="h-full w-full object-cover"
													/>
												</div>
												<div className="flex-1">
													<p className="text-xs font-medium">Image</p>
													<p className="text-xs text-gray-500">
														{Math.round(image.width)}×{Math.round(image.height)}
														px
													</p>
													<input
														type="file"
														id={`file-${image.id}`}
														className="hidden"
														accept="image/*"
														onChange={(e) => {
															if (e.target.files?.[0]) {
																handleImageUpload(image.id, e.target.files[0]);
															}
														}}
													/>
													<Button
														variant="ghost"
														size="sm"
														className="h-7 mt-1 text-xs"
														onClick={(e) => {
															e.stopPropagation();
															document
																.getElementById(`file-${image.id}`)
																?.click();
														}}
													>
														Replace
													</Button>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>

							{template.images.length === 0 && (
								<div className="text-center p-4 border border-dashed rounded-md">
									<p className="text-sm text-gray-500">No images added yet</p>
									<p className="text-xs text-gray-400 mt-1">
										Click "Add Image" to add an image to your template
									</p>
								</div>
							)}

							{activeElement && activeImage && (
								<>
									<div className="mt-4">
										<Label className="text-sm">Quick Alignment</Label>
										<ElementControls
											onCenterX={() => centerActiveElement("x")}
											onCenterY={() => centerActiveElement("y")}
											onCenterBoth={() => centerActiveElement("both")}
										/>
									</div>

									<Button
										variant="destructive"
										size="sm"
										onClick={deleteActiveElement}
										className="mt-4 w-full"
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Delete Selected Element
									</Button>
								</>
							)}
						</TabsContent>

						{/* Text Tab */}
						<TabsContent value="text" className="space-y-4 mt-4">
							<Button onClick={addTextElement} className="w-full">
								<Type className="mr-2 h-4 w-4" />
								Add Text
							</Button>

							<div className="space-y-3 mt-4">
								{template.texts.map((text) => (
									<Card
										key={text.id}
										className={`overflow-hidden cursor-pointer ${
											activeElement === text.id ? "ring-2 ring-primary" : ""
										}`}
										onClick={() => setActiveElement(text.id)}
									>
										<CardContent className="p-3">
											<Textarea
												value={text.content}
												onChange={(e) =>
													handleTextChange(text.id, e.target.value)
												}
												className="resize-none mb-2"
												rows={2}
												onClick={(e) => e.stopPropagation()}
											/>

											<div className="grid grid-cols-2 gap-2">
												<div className="space-y-1">
													<Label
														htmlFor={`font-${text.id}`}
														className="text-xs"
													>
														Font
													</Label>
													<Select
														value={text.style.fontFamily}
														onValueChange={(value) =>
															handleTextStyleChange(
																text.id,
																"fontFamily",
																value,
															)
														}
													>
														<SelectTrigger
															id={`font-${text.id}`}
															className="h-8"
														>
															<SelectValue placeholder="Font" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="Arial, sans-serif">
																Arial
															</SelectItem>
															<SelectItem value="'Times New Roman', serif">
																Times New Roman
															</SelectItem>
															<SelectItem value="'Courier New', monospace">
																Courier New
															</SelectItem>
															<SelectItem value="Georgia, serif">
																Georgia
															</SelectItem>
															<SelectItem value="'Segoe UI', sans-serif">
																Segoe UI
															</SelectItem>
														</SelectContent>
													</Select>
												</div>

												<div className="space-y-1">
													<Label
														htmlFor={`size-${text.id}`}
														className="text-xs"
													>
														Size
													</Label>
													<Select
														value={text.style.fontSize}
														onValueChange={(value) =>
															handleTextStyleChange(text.id, "fontSize", value)
														}
													>
														<SelectTrigger
															id={`size-${text.id}`}
															className="h-8"
														>
															<SelectValue placeholder="Size" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="12px">12px</SelectItem>
															<SelectItem value="14px">14px</SelectItem>
															<SelectItem value="16px">16px</SelectItem>
															<SelectItem value="18px">18px</SelectItem>
															<SelectItem value="24px">24px</SelectItem>
															<SelectItem value="32px">32px</SelectItem>
															<SelectItem value="48px">48px</SelectItem>
														</SelectContent>
													</Select>
												</div>

												<div className="space-y-1">
													<Label
														htmlFor={`color-${text.id}`}
														className="text-xs"
													>
														Color
													</Label>
													<div className="flex h-8 items-center gap-2">
														<input
															type="color"
															value={text.style.color}
															onChange={(e) =>
																handleTextStyleChange(
																	text.id,
																	"color",
																	e.target.value,
																)
															}
															className="w-8 h-8 rounded border p-0"
															onClick={(e) => e.stopPropagation()}
														/>
														<Input
															value={text.style.color}
															onChange={(e) =>
																handleTextStyleChange(
																	text.id,
																	"color",
																	e.target.value,
																)
															}
															className="h-8 flex-1"
															onClick={(e) => e.stopPropagation()}
														/>
													</div>
												</div>

												<div className="space-y-1">
													<Label
														htmlFor={`align-${text.id}`}
														className="text-xs"
													>
														Align
													</Label>
													<Select
														value={text.style.textAlign}
														onValueChange={(value) =>
															handleTextStyleChange(text.id, "textAlign", value)
														}
													>
														<SelectTrigger
															id={`align-${text.id}`}
															className="h-8"
														>
															<SelectValue placeholder="Align" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="left">Left</SelectItem>
															<SelectItem value="center">Center</SelectItem>
															<SelectItem value="right">Right</SelectItem>
														</SelectContent>
													</Select>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>

							{template.texts.length === 0 && (
								<div className="text-center p-4 border border-dashed rounded-md">
									<p className="text-sm text-gray-500">
										No text elements added yet
									</p>
									<p className="text-xs text-gray-400 mt-1">
										Click "Add Text" to add text to your template
									</p>
								</div>
							)}

							{activeElement && activeText && (
								<>
									<div className="mt-4">
										<Label className="text-sm">Quick Alignment</Label>
										<ElementControls
											onCenterX={() => centerActiveElement("x")}
											onCenterY={() => centerActiveElement("y")}
											onCenterBoth={() => centerActiveElement("both")}
										/>
									</div>

									<Button
										variant="destructive"
										size="sm"
										onClick={deleteActiveElement}
										className="mt-4 w-full"
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Delete Selected Element
									</Button>
								</>
							)}
						</TabsContent>
					</Tabs>
				</div>

				{/* Main Canvas Area */}
				<div
					ref={canvasContainerRef}
					className="flex-1 overflow-auto bg-gray-100 p-8 flex items-center justify-center"
				>
					<div className="relative">
						<EditorCanvas
							ref={canvasRef}
							template={template}
							activeElement={activeElement}
							setActiveElement={setActiveElement}
							setTemplate={setTemplate}
							scale={scale}
							isCustomizing={true}
						/>
						<div className="absolute -bottom-8 left-0 right-0 text-center text-xs text-gray-500">
							{selectedSize.label} ({Math.round(template.width * scale)}×
							{Math.round(template.height * scale)}px)
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
