"use client";

import { Button } from "@/shared/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSkeleton,
	useSidebar,
} from "@/shared/components/ui/sidebar";
import { cn } from "@/shared/lib/utils";
import { useLogoutMutation } from "@/shared/repository/auth/query";
import { useSessionQuery } from "@/shared/repository/session-manager/query";
import { LogOutIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { tabsData } from "../data/tabs";

export default function AppSidebar() {
	const { open, openMobile } = useSidebar();
	const pathname = usePathname();
	const router = useRouter();
	const { data, isLoading } = useSessionQuery();
	const { mutate: logout, isPending } = useLogoutMutation();

	return (
		<Sidebar variant="floating">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<div
							className={cn(
								"flex items-center gap-2 cursor-pointer",
								open || openMobile ? "" : "justify-center",
							)}
							onClick={() => router.push("/")}
							onKeyDown={() => {}}
						>
							{(open || openMobile) && (
								<div>
									<span className="text-title font-medium text-foreground leading-none">
										LRWH Customize Gift
									</span>
								</div>
							)}
						</div>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				{isLoading || !data || !data.isLoggedIn || !data.role ? (
					<SidebarGroup>
						<SidebarMenuSkeleton showIcon />
						<SidebarMenuSkeleton showIcon />
						<SidebarMenuSkeleton showIcon />
						<SidebarMenuSkeleton showIcon />
						<SidebarMenuSkeleton showIcon />
					</SidebarGroup>
				) : (
					<SidebarGroup>
						{tabsData[data.role].map((tab) => {
							return (
								<SidebarMenu key={tab.href}>
									<SidebarMenuItem>
										<SidebarMenuButton
											isActive={pathname.startsWith(tab.href)}
											asChild
											tooltip={tab.label}
										>
											<Link
												href={tab.href}
												className="text-foreground flex gap-2 items-center"
											>
												<tab.icon className="w-4 h-4" />
												<span>{tab.label}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								</SidebarMenu>
							);
						})}
					</SidebarGroup>
				)}
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild>
							<Button
								variant="destructive"
								onClick={() => logout()}
								disabled={isPending}
								className="cursor-pointer justify-start"
							>
								<LogOutIcon className="w-4 h-4" />
								<span>Logout</span>
							</Button>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
