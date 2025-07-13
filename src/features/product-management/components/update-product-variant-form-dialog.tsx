import { Button } from "@/shared/components/ui/button";
import {
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { useDialogStore } from "@/shared/hooks/use-dialog";
import {
	type UpdateProductVariantRequest,
	updateProductVariantSchema,
} from "@/shared/repository/product/dto";
import { useUpdateProductVariantMutation } from "@/shared/repository/product/query";
import type { ProductVariant } from "@/shared/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
	variant: ProductVariant;
	readonly?: boolean;
};

export default function UpdateProductVariantFormDialog({
	variant,
	readonly,
}: Props) {
	const form = useForm<UpdateProductVariantRequest>({
		resolver: zodResolver(updateProductVariantSchema),
		defaultValues: {
			name: variant.name,
			description: variant.description || "",
			width: variant.width,
			height: variant.height,
		},
	});

	const { mutate: updateProductVariant, isPending } =
		useUpdateProductVariantMutation({
			productId: variant.productId,
			variantId: variant.id,
		});
	const { closeDialog } = useDialogStore();

	const onSubmitHandler = form.handleSubmit((data) => {
		updateProductVariant(data, {
			onSuccess: (res) => {
				if (!res.success) {
					toast.error(res.error || "Failed to update product variant");
					return;
				}

				toast.success(res.message || "Product variant updated successfully");
				closeDialog();
				form.reset();
			},
		});
	});

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>
					{readonly ? "View Variant" : "Update Variant"}
				</DialogTitle>
				<DialogDescription>
					{readonly
						? "View product variant details."
						: "Update product variant details."}
				</DialogDescription>
			</DialogHeader>
			<Form {...form}>
				<form onSubmit={onSubmitHandler} className="space-y-4">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="Enter variant name"
										disabled={readonly}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Description</FormLabel>
								<FormControl>
									<Textarea
										{...field}
										placeholder="Enter variant description"
										rows={3}
										disabled={readonly}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="grid grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="width"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Width</FormLabel>
									<FormControl>
										<Input
											type="number"
											{...field}
											placeholder="Enter width"
											min={0}
											disabled={readonly}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="height"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Height</FormLabel>
									<FormControl>
										<Input
											type="number"
											{...field}
											placeholder="Enter height"
											min={0}
											disabled={readonly}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="secondary"
							onClick={closeDialog}
							disabled={isPending}
						>
							Cancel
						</Button>
						{!readonly && (
							<Button type="submit" disabled={isPending}>
								{isPending ? "Creating..." : "Update Variant"}
							</Button>
						)}
					</DialogFooter>
				</form>
			</Form>
		</DialogContent>
	);
}
