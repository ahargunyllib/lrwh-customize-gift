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
	type CreateProductVariantRequest,
	createProductVariantSchema,
} from "@/shared/repository/product/dto";
import { useCreateProductVariantMutation } from "@/shared/repository/product/query";
import type { Product } from "@/shared/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
	product: Product;
};

export default function CreateProductVariantFormDialog({ product }: Props) {
	const form = useForm<CreateProductVariantRequest>({
		resolver: zodResolver(createProductVariantSchema),
		defaultValues: {
			name: "",
			description: "",
			width: 0,
			height: 0,
		},
	});

	const { mutate: createProductVariant, isPending } =
		useCreateProductVariantMutation({ productId: product.id });
	const { closeDialog } = useDialogStore();

	const onSubmitHandler = form.handleSubmit((data) => {
		createProductVariant(data, {
			onSuccess: (res) => {
				if (!res.success) {
					toast.error(res.error || "Failed to create product variant");
					return;
				}

				toast.success(res.message || "Product variant created successfully");
				closeDialog();
				form.reset();
			},
		});
	});

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Add Product Variant</DialogTitle>
				<DialogDescription>Add a new variant to the product.</DialogDescription>
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
									<Input {...field} placeholder="Enter variant name" />
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
							onClick={() => closeDialog()}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? "Creating..." : "Create Variant"}
						</Button>
					</DialogFooter>
				</form>
			</Form>
		</DialogContent>
	);
}
