// "@/shared/hooks/use-scroll-to-active.ts"
import { useEffect, useRef } from "react";

type Options = {
	/** The id to scroll to (or undefined if the tab isn't active for this type). */
	activeId?: string;
	/** Extra deps to re-run the scroll (e.g., list length). */
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	deps?: any[];
	/** ScrollIntoView options */
	behavior?: ScrollBehavior;
	block?: ScrollLogicalPosition;
	/** Optional highlight classes to flash briefly on the target element */
	highlightClasses?: string[];
	/** How long the highlight should stay (ms) */
	highlightMs?: number;
};

export function useScrollToActive<T extends HTMLElement>({
	activeId,
	deps = [],
	behavior = "smooth",
	block = "center",
	highlightClasses = ["ring-2", "ring-primary", "rounded-md"],
	highlightMs = 900,
}: Options) {
	const mapRef = useRef(new Map<string, T>());

	const getRef = (id: string) => (el: T | null) => {
		if (el) mapRef.current.set(id, el);
		else mapRef.current.delete(id);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (!activeId) return;
		const el = mapRef.current.get(activeId);
		if (!el) return;

		// Wait a frame so DOM is fully painted
		const raf = requestAnimationFrame(() => {
			el.scrollIntoView({ behavior, block });

			if (highlightClasses.length) {
				el.classList.add(...highlightClasses);
				const t = setTimeout(
					() => el.classList.remove(...highlightClasses),
					highlightMs,
				);
				return () => clearTimeout(t);
			}
		});

		return () => cancelAnimationFrame(raf);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeId, ...deps]);

	return { getRef };
}
