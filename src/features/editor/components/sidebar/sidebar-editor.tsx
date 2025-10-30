"use client";
import { Button } from "@/shared/components/ui/button";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/components/ui/tabs";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { ImageIcon, Menu, Type, X } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useTemplateContext } from "../../containers/template-editor";
import ImagesTab from "../tabs/editor/images-tab";
import TextTab from "../tabs/editor/text-tab";

type TabValue = "image" | "text";

export default function EditorSidebar({
	isOpen,
	toggleSidebar,
	closeSidebar,
}: {
	isOpen: boolean;
	toggleSidebar: () => void;
	closeSidebar: () => void;
}) {
	const { activeElement } = useTemplateContext();
	const isMobile = useIsMobile();

	const incomingTab: TabValue = useMemo(
		() => (activeElement?.type === "text" ? "text" : "image"),
		[activeElement?.type],
	);
	const [tab, setTab] = useState<TabValue>(incomingTab);

	useEffect(() => {
		setTab(incomingTab);
	}, [incomingTab]);

	const Panel = (
		<div
			className={`bg-gray-50 p-4 overflow-y-auto h-full w-72 md:w-64
      fixed top-0 left-0 z-50 shadow-xl transition-transform duration-300 ease-in-out
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
      md:border-r md:shadow-none`}
		>
			<div className="flex items-center justify-between mb-4">
				<h2 className="font-semibold">Template Editor</h2>
				<Button variant="ghost" size="icon" onClick={closeSidebar}>
					<X className="h-5 w-5" />
				</Button>
			</div>

			<Tabs
				value={tab}
				onValueChange={(v) => setTab(v as TabValue)}
				className="w-full"
			>
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="image">
						<ImageIcon className="h-4 w-4 mr-1" />
						Images
					</TabsTrigger>
					<TabsTrigger value="text">
						<Type className="h-4 w-4 mr-1" />
						Text
					</TabsTrigger>
				</TabsList>

				<TabsContent value="image">
					<ImagesTab />
				</TabsContent>
				<TabsContent value="text">
					<TextTab />
				</TabsContent>
			</Tabs>
		</div>
	);

	return (
		<Fragment>
			{/* <Button
				variant="outline"
				size="icon"
				className="fixed top-4 left-4 z-50"
				onClick={toggleSidebar}
			>
				<Menu className="h-5 w-5" />
			</Button> */}

			{isOpen && (
				// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
				<div
					className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
					aria-hidden="true"
					onClick={closeSidebar}
				/>
			)}

			{Panel}
		</Fragment>
	);
}
