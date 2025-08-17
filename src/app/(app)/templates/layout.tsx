"use client";

import { useTemplatesStore } from "@/features/templates/stores/use-templates-store";
import FullscreenLoader from "@/shared/components/fullscreen-loader";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

export default function Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const pathname = usePathname();

	const order = useTemplatesStore((s) => s.order);
	const id = order?.id;

	const loaded = useMemo(() => typeof id !== "undefined", [id]);

	const hasOrder = useMemo(() => id !== "", [id]);
	const isOnboardingPage = useMemo(
		() => pathname === "/templates/onboarding",
		[pathname],
	);

	useEffect(() => {
		if (loaded && !hasOrder && !isOnboardingPage) {
			router.replace("/templates/onboarding");
		}
	}, [hasOrder, router, isOnboardingPage, loaded]);

	if (!loaded && !hasOrder && !isOnboardingPage) {
		return <FullscreenLoader label="Validating order..." delayMs={0} />;
	}

	return children;
}
