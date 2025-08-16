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
	const { id } = order ?? {};

	const hasOrder = useMemo(() => Boolean(id), [id]);
	const isOnboardingPage = useMemo(
		() => pathname === "/templates/onboarding",
		[pathname],
	);

	useEffect(() => {
		if (!hasOrder && !isOnboardingPage) {
			router.replace("/templates/onboarding");
		}
	}, [hasOrder, router, isOnboardingPage]);

	if (!hasOrder && !isOnboardingPage) {
		return <FullscreenLoader label="Validating order..." delayMs={0} />;
	}

	return children;
}
