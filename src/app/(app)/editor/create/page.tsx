"use client";

import TemplateCreator from "@/features/editor/components/template-creator";
import { useIsMobile } from "@/shared/hooks/use-mobile";

export default function TemplateCreatorPage() {
	const isMobile = useIsMobile();

	// if (isMobile) {
	// 	return (
	// 		<div className="flex min-h-screen items-center justify-center bg-gray-100">
	// 			<p className="text-center text-lg font-semibold text-gray-700">
	// 				The template creator can't be opened on a smartphone or small device.
	// 			</p>
	// 		</div>
	// 	);
	// }

	return <TemplateCreator />;
}
