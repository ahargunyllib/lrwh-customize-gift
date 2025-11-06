"use client";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/components/ui/tabs";
import { ImagePlus, Layout, Type, X } from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useTemplateContext } from "../../containers/template-creator";
import ImagesTab from "../tabs/creator/images-tab";
import SettingsTab from "../tabs/creator/settings-tab";
import ShapesLinesTab from "../tabs/creator/shapes-lines-tab";
import TextTab from "../tabs/creator/text-tab";

interface Props {
	open: boolean;
	onClose: () => void;
}
type TabValue = "image" | "text" | "settings";

export default function Sidebar({ open, onClose }: Props) {
	const isMobile = useIsMobile();
	const { activeElement } = useTemplateContext();

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	const incomingTab: TabValue = useMemo(() => {
		if (!activeElement) return "settings";
		if (activeElement.type === "text") return "text";
		if (activeElement.type === "line" || activeElement.type === "shape")
			return "settings";
		return "image";
	}, [activeElement?.type]);
	const [tab, setTab] = useState<TabValue>(incomingTab);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		setTab(incomingTab);
	}, [incomingTab, activeElement]);

	const Panel = (
		<div
			className={`bg-gray-50 p-4 overflow-y-auto h-full w-72 md:w-84
      md:static md:translate-x-0 md:border-r md:shadow-none
      fixed top-0 left-0 z-50 shadow-xl transition-transform duration-300 ease-in-out
      ${open ? "translate-x-0" : "-translate-x-full"}`}
		>
			{/* Mobile header */}
			{isMobile && (
				<div className="flex items-center justify-between mb-4">
					<h2 className="font-semibold">Template Editor</h2>
					<Button variant="ghost" size="icon" onClick={onClose}>
						<X className="h-5 w-5" />
					</Button>
				</div>
			)}

			<Tabs
				value={tab}
				className="w-full"
				onValueChange={(v) => setTab(v as TabValue)}
			>
				<TabsList className="grid w-full grid-cols-3 gap-4">
					<TabsTrigger value="settings">
						<Layout className="h-4 w-4 mr-1" />
						Settings
					</TabsTrigger>
					<TabsTrigger value="image">
						<ImagePlus className="h-4 w-4 mr-1" />
						Images
					</TabsTrigger>
					<TabsTrigger value="text">
						<Type className="h-4 w-4 mr-1" />
						Text
					</TabsTrigger>
				</TabsList>

				<TabsContent value="settings">
					<SettingsTab />
					<ShapesLinesTab />
				</TabsContent>
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
			{/* Overlay (mobile) */}
			{isMobile && open && (
				// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
				<div
					className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
					onClick={onClose}
					aria-hidden
				/>
			)}
			{Panel}
		</Fragment>
	);
}
