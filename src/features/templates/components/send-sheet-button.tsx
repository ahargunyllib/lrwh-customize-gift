import { Button } from "@/shared/components/ui/button";
import { useSheetStore } from "@/shared/hooks/use-sheet";
import { SendIcon } from "lucide-react";
import SendSheet from "./send-sheet";

export default function SendSheetButton() {
	const { openSheet } = useSheetStore();

	return (
		<Button
			size="lg"
			className="gap-2 font-medium text-xs text-white bg-black px-4 py-3 rounded-md h-fit sm:hidden flex w-full"
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
