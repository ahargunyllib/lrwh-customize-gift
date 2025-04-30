import AppSidebar from "@/features/dashboard/components/app-sidebar";
import Navbar from "@/features/dashboard/components/navbar";
import { SidebarProvider } from "@/shared/components/ui/sidebar";

type Prop = Readonly<{
	children: React.ReactNode;
}>;

export default function Layout({ children }: Prop) {
	return (
		<SidebarProvider className="py-2 pr-2 min-h-screen w-full flex flex-col gap-4 md:gap-1 md:flex-row">
			<AppSidebar />
			<Navbar />
			<section className="p-4 w-full border rounded-xl">{children}</section>
		</SidebarProvider>
	);
}
