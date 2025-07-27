import { Skeleton } from "@/shared/components/ui/skeleton";
import { useGetProductsQuery } from "@/shared/repository/product/query";
import ProductVariantSelect from "../components/tabs/creator/product-variant-select";

type Props = {
	onValueChange: (value: string, width: number, height: number) => void;
	value: string | undefined;
};

export default function ProductVariantSelectContainer({
	onValueChange,
	value,
}: Props) {
	const { data: res, isLoading } = useGetProductsQuery({});

	if (isLoading) {
		return <Skeleton className="w-full h-8" />;
	}

	if (!res?.success || !res.data) {
		return <div className="text-red-500">Failed to fetch products</div>;
	}

	return (
		<ProductVariantSelect
			products={res.data.products}
			onValueChange={onValueChange}
			value={value}
		/>
	);
}
