import { NuqsAdapter } from "nuqs/adapters/next/app";

export default function NuqsProvider({ children }: React.PropsWithChildren) {
	return <NuqsAdapter>{children}</NuqsAdapter>;
}
