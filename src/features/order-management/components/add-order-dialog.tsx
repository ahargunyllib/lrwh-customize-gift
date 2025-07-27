import { Button } from "@/shared/components/ui/button";
import {
	DialogContent,
	DialogDescription,
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
import { Label } from "@/shared/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import type { Product, ProductVariant } from "@/shared/types";
import { useFieldArray } from "react-hook-form";
import { useCreateOrderForm } from "../hooks/use-create-order-form";

type Props = {
	products: (Product & {
		variants: ProductVariant[];
	})[];
};

export default function AddOrderDialog({ products }: Props) {
	const form = useCreateOrderForm();

	const productVariantIdsArray = useFieldArray({
		control: form.control,
		name: "productVariantIds",
	});

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Add Order</DialogTitle>
				<DialogDescription>Add a new order to the system.</DialogDescription>
			</DialogHeader>
			<Form {...form}>
				<form onSubmit={form.onSubmitHandler} className="space-y-4">
					<FormField
						control={form.control}
						name="orderNumber"
						render={({ field }) => {
							return (
								<FormItem>
									<FormLabel>Order Number</FormLabel>
									<FormControl>
										<Input {...field} placeholder="Enter order number" />
									</FormControl>
									<FormMessage />
								</FormItem>
							);
						}}
					/>
					<FormField
						control={form.control}
						name="username"
						render={({ field }) => {
							return (
								<FormItem>
									<FormLabel>Username</FormLabel>
									<FormControl>
										<Input {...field} placeholder="Enter username" />
									</FormControl>
									<FormMessage />
								</FormItem>
							);
						}}
					/>
					<div className="space-y-2">
						<div className="flex flex-row justify-between items-center">
							<Label>Product Variants</Label>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => {
									productVariantIdsArray.append(undefined);
								}}
							>
								Add Variant
							</Button>
						</div>
						{productVariantIdsArray.fields.length === 0 && (
							<p className="text-sm text-gray-500 text-center">
								No product variants added. Click "Add Variant" to include
								products.
							</p>
						)}
						{productVariantIdsArray.fields.map((field, index) => (
							<FormField
								control={form.control}
								key={field.id}
								name={`productVariantIds.${index}`}
								render={({ field: variantField }) => {
									return (
										<FormItem>
											<Select
												onValueChange={variantField.onChange}
												value={variantField.value}
											>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select a product variant" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{products.map((product) =>
														product.variants.map((variant) => (
															<SelectItem key={variant.id} value={variant.id}>
																{`${product.name} - ${variant.name}`}
															</SelectItem>
														)),
													)}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									);
								}}
							/>
						))}
					</div>
					<Button type="submit">
						{form.isLoading ? "Creating..." : "Create Order"}
					</Button>
				</form>
			</Form>
		</DialogContent>
	);
}
