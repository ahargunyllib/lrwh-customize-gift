import { Button } from "@/shared/components/ui/button";
import { useDialogStore } from "@/shared/hooks/use-dialog";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useSheetStore } from "@/shared/hooks/use-sheet";
import type {
	OrderProductVariant,
	Product,
	ProductVariant,
} from "@/shared/types";
import { useTemplatesStore } from "../stores/use-templates-store";
import DeleteWarningDialog from "./delete-warning-dialog";
import DeleteWarningSheet from "./delete-warning-sheet";

export default function ListFilledTemplates({
	selectedProductVariant,
}: {
	selectedProductVariant: {
		id: ProductVariant["id"];
		name: ProductVariant["name"];
		product: {
			id: Product["id"];
			name: Product["name"];
		};
		templates: {
			id: OrderProductVariant["id"];
			dataURL: string | null;
		}[];
	};
}) {
	const { deleteDataURLTemplate } = useTemplatesStore();
	const isMobile = useIsMobile();
	const { openDialog, closeDialog } = useDialogStore();
	const { openSheet, closeSheet } = useSheetStore();

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2">
			{selectedProductVariant.templates.map((template) => (
				<div
					key={template.id}
					className="flex flex-col gap-2 items-center border"
				>
					<img
						src={template.dataURL || "https://placekitten.com/300/200"}
						alt="Template Preview"
						className="size-40 object-contain rounded-lg border"
					/>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							if (isMobile) {
								openSheet({
									children: (
										<DeleteWarningSheet
											onDelete={() => {
												deleteDataURLTemplate(template.id);
												closeSheet();
											}}
										/>
									),
								});
								return;
							}

							openDialog({
								children: (
									<DeleteWarningDialog
										onDelete={() => {
											deleteDataURLTemplate(template.id);
											closeDialog();
										}}
									/>
								),
							});
						}}
						className="text-destructive hover:text-destructive font-semibold hover:font-bold w-full"
					>
						Hapus
					</Button>
				</div>
			))}
		</div>
	);
}
