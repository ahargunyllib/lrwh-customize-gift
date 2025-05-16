"use client";
import type { TemplateData } from "@/shared/types/template";
import { useEffect } from "react";

export function useTemplatePersistence(
	loadId: string | undefined,
	setInitial: (tpl: TemplateData) => void,
) {
	/* ---- load once (if query has id) ---- */
	useEffect(() => {
		if (!loadId) return;
		const saved: TemplateData[] = JSON.parse(
			localStorage.getItem("customTemplates") || "[]",
		);
		const found = saved.find((t) => t.id === loadId);
		if (found) setInitial(found);
	}, [loadId, setInitial]);

	/* ---- save helper ---- */
	const save = (tpl: TemplateData) => {
		const stored: TemplateData[] = JSON.parse(
			localStorage.getItem("customTemplates") || "[]",
		);
		const idx = stored.findIndex((t) => t.id === tpl.id);
		if (idx >= 0) stored[idx] = tpl;
		else stored.push(tpl);
		localStorage.setItem("customTemplates", JSON.stringify(stored));
	};

	return { save };
}
