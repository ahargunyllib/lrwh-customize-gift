import {
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { useGetProductsQuery } from "@/shared/repository/product/query";
import { Loader2Icon } from "lucide-react";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import AddOrderDialog from "../components/add-order-dialog";

export default function AddOrderDialogContainer() {
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

	return <AddOrderDialog products={res.data.products} />;
}
