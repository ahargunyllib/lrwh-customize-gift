import OrdersTableContainer from "@/features/order-management/container/orders-table-container";
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
					<OrdersTableContainer />
				</Suspense>
			</CardContent>
		</Card>
	);
}
