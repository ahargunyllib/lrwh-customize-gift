"use client";
import { Button } from "@/shared/components/ui/button";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { ArrowLeft, Loader2Icon, Menu, Save } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
	title: string;
	onMenuClick: () => void;
	onSave: () => void;
	isSaving: boolean;
}
export default function HeaderBar({
	title,
	onMenuClick,
	onSave,
	isSaving,
}: Props) {
	const isMobile = useIsMobile();
	const router = useRouter();

	return (
		<header className="border-b bg-white">
			<div className="container flex items-center justify-between py-3">
				<div className="flex items-center gap-2 md:gap-4">
					{isMobile && (
						<Button variant="ghost" size="icon" onClick={onMenuClick}>
							<Menu className="h-5 w-5" />
						</Button>
					)}
					<Button variant="ghost" size="icon" onClick={() => router.back()}>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<h1 className="text-lg md:text-xl font-bold truncate">{title}</h1>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={onSave}
					disabled={isSaving}
				>
					{isSaving ? (
						<>
							<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
							<span className="hidden sm:inline">Saving...</span>
							<span className="sm:hidden">Saving...</span>
						</>
					) : (
						<>
							<Save className="mr-2 h-4 w-4" />
							<span className="hidden sm:inline">Save Template</span>
							<span className="sm:hidden">Save</span>
						</>
					)}
				</Button>
			</div>
		</header>
	);
}
