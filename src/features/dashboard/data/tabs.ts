import { ReceiptIcon, User2Icon } from "lucide-react";

export const tabsData = {
	1: [
		{
			label: "Profile",
			href: "/dashboard/profile",
			icon: User2Icon,
		},
		{
			label: "Order Management",
			href: "/dashboard/order-management",
			icon: ReceiptIcon,
		},
	],
} as const;

export type TabHref = (typeof tabsData)[keyof typeof tabsData][number]["href"];
export type TabLabel =
	(typeof tabsData)[keyof typeof tabsData][number]["label"];
