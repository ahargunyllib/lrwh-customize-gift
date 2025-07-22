import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import type { Product, ProductVariant } from "@/shared/types";

type Props = {
	products: (Product & {
		variants: ProductVariant[];
	})[];
	onValueChange: (value: string, width: number, height: number) => void;
	value: string | undefined;
};

export default function ProductVariantSelect({
	products,
	onValueChange,
	value,
}: Props) {
	return (
		<Select
			value={value}
			onValueChange={(value) => {
				const variant = products
					.find((product) =>
						product.variants.some((variant) => variant.id === value),
					)
					?.variants.find((variant) => variant.id === value);
				if (variant) {
					onValueChange(value, variant.width, variant.height);
				}
			}}
		>
			<SelectTrigger className="w-full">
				<SelectValue placeholder="Select a product variant" />
			</SelectTrigger>
			<SelectContent>
				{products.map((product) =>
					product.variants.map((variant) => (
						<SelectItem key={variant.id} value={variant.id}>
							{product.name} - {variant.name} ({variant.width}x{variant.height})
						</SelectItem>
					)),
				)}
			</SelectContent>
		</Select>
	);
}
