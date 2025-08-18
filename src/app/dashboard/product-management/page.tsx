import ProductsTableContainer from "@/features/product-management/containers/products-table-container";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Suspense } from "react";

export default function Page() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Product Management</CardTitle>
				<CardDescription>
					Manage your products efficiently with our comprehensive product
					management system.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Suspense>
					<ProductsTableContainer />
				</Suspense>
			</CardContent>
		</Card>
	);
}
