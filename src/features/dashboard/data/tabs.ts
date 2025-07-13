import {
	LayoutTemplate,
	ReceiptIcon,
	ShoppingCartIcon,
	User2Icon,
} from "lucide-react";

export const tabsData = {
	1: [
		{
			label: "Profile",
			href: "/dashboard/profile",
			icon: User2Icon,
		},
		{
			label: "Product Management",
			href: "/dashboard/product-management",
			icon: ShoppingCartIcon,
		},
		{
			label: "Order Management",
			href: "/dashboard/order-management",
			icon: ReceiptIcon,
		},
		{
			label: "Manage Templates",
			href: "/",
			icon: LayoutTemplate,
		},
	],
} as const;

export type TabHref = (typeof tabsData)[keyof typeof tabsData][number]["href"];
export type TabLabel =
	(typeof tabsData)[keyof typeof tabsData][number]["label"];
