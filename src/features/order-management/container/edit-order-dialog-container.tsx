import {
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useGetProductsQuery } from "@/shared/repository/product/query";
import type { Order, Product, ProductVariant } from "@/shared/types";
import { Loader2Icon } from "lucide-react";
import EditOrderDialog from "../components/edit-order-dialog";

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
};

export default function EditOrderDialogContainer({ order }: Props) {
	const { data: res, isLoading } = useGetProductsQuery({});

	if (isLoading) {
		return (
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						<Skeleton className="w-28 h-8" />
					</DialogTitle>
				</DialogHeader>
				<Loader2Icon className="animate-spin h-6 w-6 text-gray-500" />
			</DialogContent>
		);
	}

	if (!res?.success || !res.data) {
		return (
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Error</DialogTitle>
				</DialogHeader>
				<div className="text-red-500">Failed to fetch products</div>
			</DialogContent>
		);
	}

	return <EditOrderDialog order={order} products={res.data.products} />;
}
