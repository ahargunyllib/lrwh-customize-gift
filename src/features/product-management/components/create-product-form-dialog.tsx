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
	type CreateProductRequest,
	createProductSchema,
} from "@/shared/repository/product/dto";
import { useCreateProductMutation } from "@/shared/repository/product/query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function CreateProductFormDialog() {
	const form = useForm<CreateProductRequest>({
		resolver: zodResolver(createProductSchema),
		defaultValues: {
			name: "",
			description: "",
			shopeeUrl: "",
		},
	});

	const { mutate: createProduct, isPending } = useCreateProductMutation();
	const { closeDialog } = useDialogStore();

	const onSubmitHandler = form.handleSubmit((data) => {
		createProduct(data, {
			onSuccess: (res) => {
				if (!res.success) {
					toast.error(res.error || "Failed to create product");
					return;
				}

				toast.success(res.message || "Product created successfully");
				closeDialog();
				form.reset();
			},
		});
	});

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Add Product</DialogTitle>
				<DialogDescription>Add a new product to the system.</DialogDescription>
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
										<Input {...field} placeholder="Enter product name" />
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
						<Button type="submit" disabled={isPending}>
							{isPending ? "Creating..." : "Create Product"}
						</Button>
					</DialogFooter>
				</form>
			</Form>
		</DialogContent>
	);
}
