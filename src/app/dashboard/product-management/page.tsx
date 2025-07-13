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
				<CardTitle>Order Management</CardTitle>
				<CardDescription>
					Manage your orders efficiently with our comprehensive order management
					system.
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
