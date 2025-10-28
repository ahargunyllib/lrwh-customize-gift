"use client";

import { Button } from "@/shared/components/ui/button";
import { useSheetStore } from "@/shared/hooks/use-sheet";
import { SendIcon } from "lucide-react";
import SendSheet from "./send-sheet";

export default function SendSheetButton() {
	const { openSheet } = useSheetStore();

	return (
		<Button
			size="lg"
			className="gap-2 font-medium text-xs bg-[#2854AD] hover:bg-[#2854AD]/80 text-white shadow-none px-4 py-3 rounded-md h-fit w-full"
			onClick={() => {
				openSheet({
					children: <SendSheet />,
				});
			}}
		>
			Kirim Template <SendIcon />
		</Button>
	);
}
