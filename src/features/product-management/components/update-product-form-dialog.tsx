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
	type UpdateProductRequest,
	updateProductSchema,
} from "@/shared/repository/product/dto";
import { useUpdateProductMutation } from "@/shared/repository/product/query";
import type { Product } from "@/shared/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
	product: Product;
	readonly?: boolean;
};

export default function UpdateProductFormDialog({
	product,
	readonly = false,
}: Props) {
	const form = useForm<UpdateProductRequest>({
		resolver: zodResolver(updateProductSchema),
		defaultValues: {
			name: product.name,
			description: product.description || "",
			shopeeUrl: product.shopeeUrl || "",
		},
	});

	const { mutate: updateProduct, isPending } = useUpdateProductMutation({
		id: product.id,
	});
	const { closeDialog } = useDialogStore();

	const onSubmitHandler = form.handleSubmit((data) => {
		updateProduct(data, {
			onSuccess: (res) => {
				if (!res.success) {
					toast.error(res.error || "Failed to update product");
					return;
				}

				toast.success(res.message || "Product updated successfully");
				closeDialog();
				form.reset();
			},
		});
	});

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>{readonly ? "Detail" : "Edit"} Product</DialogTitle>
				<DialogDescription>
					{readonly ? "View product details." : "Update product information."}
				</DialogDescription>
			</DialogHeader>
			<Form {...form}>
				<form onSubmit={onSubmitHandler} className="space-y-4">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => {
							return (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder="Enter product name"
											disabled={readonly}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							);
						}}
					/>
					<FormField
						control={form.control}
						name="description"
						render={({ field }) => {
							return (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="Enter product description"
											rows={3}
											disabled={readonly}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							);
						}}
					/>
					<FormField
						control={form.control}
						name="shopeeUrl"
						render={({ field }) => {
							return (
								<FormItem>
									<FormLabel>Shopee URL</FormLabel>
									<FormControl>
										<Input
											{...field}
											type="url"
											placeholder="Enter Shopee product URL"
											disabled={readonly}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							);
						}}
					/>
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
								{isPending ? "Updating..." : "Update Order"}
							</Button>
						)}
					</DialogFooter>
				</form>
			</Form>
		</DialogContent>
	);
}
