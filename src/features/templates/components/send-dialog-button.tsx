import { Button } from "@/shared/components/ui/button";
import { useDialogStore } from "@/shared/hooks/use-dialog";
import { SendIcon } from "lucide-react";
import SendDialog from "./send-dialog";

export default function SendDialogButton() {
	const { openDialog } = useDialogStore();

	return (
		<Button
			className="gap-2 font-medium text-xs text-white bg-black px-4 py-3 rounded-md h-fit hidden sm:flex"
			onClick={() => {
				openDialog({
					children: <SendDialog />,
				});
			}}
		>
			Kirim Template <SendIcon />
		</Button>
	);
}
