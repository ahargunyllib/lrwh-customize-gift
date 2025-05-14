"use client";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/components/ui/tabs";
import { ImagePlus, Layout, Type, X } from "lucide-react";
import { Fragment } from "react";

import { Button } from "@/shared/components/ui/button";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import ImagesTab from "../tabs/creator/images-tab";
import SettingsTab from "../tabs/creator/settings-tab";
import TextTab from "../tabs/creator/text-tab";

interface Props {
	open: boolean;
	onClose: () => void;
}

export default function Sidebar({ open, onClose }: Props) {
	const isMobile = useIsMobile();

	const Panel = (
		<div
			className={`bg-gray-50 p-4 overflow-y-auto h-full w-72 md:w-64
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

			<Tabs defaultValue="settings" className="w-full">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="settings">
						<Layout className="h-4 w-4 mr-1" />
						Settings
					</TabsTrigger>
					<TabsTrigger value="images">
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
				</TabsContent>
				<TabsContent value="images">
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
