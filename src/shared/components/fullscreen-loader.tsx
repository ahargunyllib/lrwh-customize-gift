"use client";

import { useEffect, useState } from "react";

type FullscreenLoaderProps = {
	label?: string;
	/** Delay (ms) before showing to avoid flicker on super-fast loads */
	delayMs?: number;
};

export default function FullscreenLoader({
	label = "Loading…",
	delayMs = 150,
}: FullscreenLoaderProps) {
	const [show, setShow] = useState(delayMs === 0);

	useEffect(() => {
		if (delayMs === 0) return;
		const t = setTimeout(() => setShow(true), delayMs);
		return () => clearTimeout(t);
	}, [delayMs]);

	if (!show) return null;

	return (
		<div
			aria-live="polite"
			className="fixed inset-0 z-50 grid place-items-center bg-white/75 dark:bg-slate-900/75 backdrop-blur-sm"
		>
			<div className="flex flex-col items-center gap-4">
				{/* Spinner */}
				<span
					className="block h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-transparent dark:border-slate-700 dark:border-t-transparent"
					aria-hidden="true"
				/>
				{/* Label */}
				<p className="text-sm text-slate-700 dark:text-slate-300">{label}</p>
			</div>

			{/* Respect reduced motion */}
			<style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .animate-spin {
            animation: none;
            border-top-color: currentColor;
          }
        }
      `}</style>
		</div>
	);
}
