"use client";

import {
	useCreateTemplateMutation,
	useGetTemplateById,
	useUpdateTemplateMutation,
} from "@/shared/repository/templates/query";
import type { TemplateData } from "@/shared/types/template";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useTemplatePersistence(
	loadId: string | undefined,
	setInitial: (tpl: TemplateData) => void,
) {
	const { data: res, isLoading, error } = useGetTemplateById(loadId || "");
	const { mutate: createTemplate, isPending: isCreating } =
		useCreateTemplateMutation();
	const { mutate: updateTemplate, isPending: isUpdating } =
		useUpdateTemplateMutation(loadId || "");
	const router = useRouter();

	/* ---- load once (if query has id) ---- */
	useEffect(() => {
		// if (!loadId) return;
		// const saved: TemplateData[] = JSON.parse(
		// 	localStorage.getItem("customTemplates") || "[]",
		// );
		// const found = saved.find((t) => t.id === loadId);
		// if (found) setInitial(found);

		if (!loadId) return;
		if (isLoading) return;
		if (error) return;

		if (!res) return;
		if (!res.success) return;
		if (!res.data) return;

		const { template } = res.data;

		if (!template) return;

		setInitial(template);
	}, [loadId, isLoading, error, res, setInitial]);

	/* ---- save helper ---- */
	const save = (tpl: TemplateData) => {
		// const stored: TemplateData[] = JSON.parse(
		// 	localStorage.getItem("customTemplates") || "[]",
		// );
		// const idx = stored.findIndex((t) => t.id === tpl.id);
		// if (idx >= 0) stored[idx] = tpl;
		// else stored.push(tpl);
		// localStorage.setItem("customTemplates", JSON.stringify(stored));

		if (isLoading) return;
		if (error) return;

		if (!res) return;

		if (!res.success)
			createTemplate(tpl, {
				onSuccess: (r) => {
					if (r.success) {
						router.replace("/");
						return;
					}
				},
			});
		else
			updateTemplate(tpl, {
				onSuccess: (r) => {
					if (r.success) {
						router.replace("/");
						return;
					}
				},
			});
	};

	return { save };
}
