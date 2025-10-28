import { Button } from "@/shared/components/ui/button";
import {
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { useDialogStore } from "@/shared/hooks/use-dialog";
import { useDeleteOrderMutation } from "@/shared/repository/order/query";
import type { Order } from "@/shared/types";
import { toast } from "sonner";

type Props = {
	order: {
		id: Order["id"];
		orderNumber: Order["orderNumber"];
		username: Order["username"];
	};
};

export default function DeleteOrderDialog({ order }: Props) {
	const { mutate: deleteOrder, isPending } = useDeleteOrderMutation({
		id: order.id,
	});
	const { closeDialog } = useDialogStore();

	const handleDelete = () => {
		deleteOrder(undefined, {
			onSuccess: (res) => {
				if (!res.success) {
					toast.error(res.message || "Failed to delete order");
					return;
				}

				closeDialog();
				toast.success(res.message || "Order deleted successfully");
			},
		});
	};

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Delete Order</DialogTitle>
				<DialogDescription>
					Are you sure you want to delete this order? This action cannot be
					undone.
				</DialogDescription>
			</DialogHeader>
			<div className="space-y-2">
				<p className="text-sm text-gray-700">
					<span className="font-medium">Order Number:</span> {order.orderNumber}
				</p>
				<p className="text-sm text-gray-700">
					<span className="font-medium">Username:</span> {order.username}
				</p>
			</div>
			<DialogFooter>
				<Button variant="outline" onClick={closeDialog} disabled={isPending}>
					Cancel
				</Button>
				<Button
					variant="destructive"
					onClick={handleDelete}
					disabled={isPending}
				>
					{isPending ? "Deleting..." : "Delete Order"}
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}
