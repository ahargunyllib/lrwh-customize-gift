import { useTemplatesStore } from "../stores/use-templates-store";

export default function Header() {
	const {
		order: { username, orderNumber },
	} = useTemplatesStore();

	return (
		<header className="bg-white px-6 md:px-14 py-4 space-y-1 border-b border-[#F2F4F7]">
			<h1 className="text-xl font-medium">Hai, {username}!</h1>
			<p className="text-xs text-[#98A2B3]">Order ID : {orderNumber}</p>
		</header>
	);
}
