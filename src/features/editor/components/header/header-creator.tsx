"use client";
import { Button } from "@/shared/components/ui/button";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { ArrowLeft, Menu, Save } from "lucide-react";
import Link from "next/link";

interface Props {
	title: string;
	onMenuClick: () => void;
	onSave: () => void;
}
export default function HeaderBar({ title, onMenuClick, onSave }: Props) {
	const isMobile = useIsMobile();

	return (
		<header className="border-b bg-white">
			<div className="container flex items-center justify-between py-3">
				<div className="flex items-center gap-2 md:gap-4">
					{isMobile && (
						<Button variant="ghost" size="icon" onClick={onMenuClick}>
							<Menu className="h-5 w-5" />
						</Button>
					)}
					<Link href="/templates">
						<Button variant="ghost" size="icon">
							<ArrowLeft className="h-5 w-5" />
						</Button>
					</Link>
					<h1 className="text-lg md:text-xl font-bold truncate">{title}</h1>
				</div>
				<Button variant="outline" size="sm" onClick={onSave}>
					<Save className="mr-2 h-4 w-4" />
					<span className="hidden sm:inline">Save Template</span>
					<span className="sm:hidden">Save</span>
				</Button>
			</div>
		</header>
	);
}
