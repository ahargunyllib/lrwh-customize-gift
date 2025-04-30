"use client";

import { Button } from "@/shared/components/ui/button";
import { useSidebar } from "@/shared/components/ui/sidebar";
import { MenuIcon } from "lucide-react";
import Image from "next/image";

export default function Navbar() {
	const { toggleSidebar } = useSidebar();

	return (
		<div className="flex flex-row justify-between items-center p-4 rounded-xl border md:hidden">
			<div className="flex flex-row gap-2">
				<span className="text-title font-medium text-foreground leading-none">
					LRWH Customize Gift
				</span>
			</div>

			<Button variant="outline" size="icon" onClick={toggleSidebar}>
				<MenuIcon className="text-foreground" />
			</Button>
		</div>
	);
}
