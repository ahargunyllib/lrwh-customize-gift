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
import { Label } from "@/shared/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import type { Order, Product, ProductVariant } from "@/shared/types";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { useEditOrderForm } from "../hooks/use-edit-order-form";

type Props = {
	order: {
		id: Order["id"];
		orderNumber: Order["orderNumber"];
		username: Order["username"];
		products: {
			id: Product["id"];
			name: Product["name"];
			productVariant: {
				id: ProductVariant["id"];
				name: ProductVariant["name"];
			};
		}[];
	};
	products: (Product & {
		variants: ProductVariant[];
	})[];
};

export default function EditOrderDialog({ order, products }: Props) {
	const form = useEditOrderForm(order);

	const productVariantsArray = useFieldArray({
		control: form.control,
		name: "productVariants",
	});

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Edit Order</DialogTitle>
				<DialogDescription>
					Edit order details. Only available when no images have been uploaded.
				</DialogDescription>
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
									productVariantsArray.append({
										productVariantId: products[0]?.variants[0]?.id || "",
										quantity: 1,
									});
								}}
							>
								Add Variant
							</Button>
						</div>
						{productVariantsArray.fields.length === 0 && (
							<p className="text-sm text-gray-500 text-center">
								No product variants added. Click "Add Variant" to include
								products.
							</p>
						)}
						{productVariantsArray.fields.map((field, index) => (
							<div key={field.id} className="flex flex-row items-center gap-2">
								<FormField
									control={form.control}
									name={`productVariants.${index}.productVariantId`}
									render={({ field: productVariantField }) => {
										return (
											<FormItem className="flex-1">
												<Select
													onValueChange={(value) => {
														productVariantField.onChange(value);
													}}
													value={productVariantField.value}
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
											</FormItem>
										);
									}}
								/>
								<FormField
									control={form.control}
									name={`productVariants.${index}.quantity`}
									render={({ field: quantityField }) => (
										<FormItem className="shrink">
											<FormControl>
												<div className="flex flex-row items-center gap-2">
													<Button
														type="button"
														variant="outline"
														size="icon"
														onClick={() => {
															const newValue = Math.max(
																1,
																(quantityField.value || 1) - 1,
															);
															quantityField.onChange(newValue);
														}}
													>
														<MinusIcon className="size-4" />
													</Button>
													<Input
														type="number"
														min={1}
														className="text-center w-16"
														value={quantityField.value}
														onChange={(e) => {
															const value = Number.parseInt(e.target.value, 10);
															quantityField.onChange(
																Number.isNaN(value) ? 1 : value,
															);
														}}
													/>
													<Button
														type="button"
														variant="outline"
														size="icon"
														onClick={() => {
															const newValue = (quantityField.value || 1) + 1;
															quantityField.onChange(newValue);
														}}
													>
														<PlusIcon className="size-4" />
													</Button>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						))}
					</div>
					<DialogFooter>
						<Button type="submit">
							{form.isLoading ? "Updating..." : "Update Order"}
						</Button>
					</DialogFooter>
				</form>
			</Form>
		</DialogContent>
	);
}
