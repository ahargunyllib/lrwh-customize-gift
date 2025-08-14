"use client";

import { useTemplatesStore } from "@/features/templates/stores/use-templates-store";
import { useGetTemplateById } from "@/shared/repository/templates/query";
import dynamic from "next/dynamic";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import FullscreenLoader from "../../../../shared/components/fullscreen-loader";

const TemplateEditor = dynamic(
	() =>
		import("../../../../features/editor/containers/template-editor").then(
			(m) => m.default,
		),
	{
		ssr: false,
		loading: () => <FullscreenLoader label="Loading template editor..." />,
	},
);

export default function TemplateEditorPage() {
	const router = useRouter();
	const params = useParams<{ id: string }>();
	const searchParams = useSearchParams();

	const id = params?.id;
	const orderProductVariantId = searchParams.get("orderProductVariantId") ?? "";

	const { order } = useTemplatesStore();
	const productVariants = order?.productVariants ?? [];

	const isOrderProductVariantValid = useMemo(() => {
		if (!orderProductVariantId) return false;
		return productVariants.some((pv) =>
			pv?.templates?.some((t) => t?.id === orderProductVariantId),
		);
	}, [productVariants, orderProductVariantId]);

	// Early validations & safe navigation
	useEffect(() => {
		if (!id || !orderProductVariantId || !isOrderProductVariantValid) {
			router.back();
		}
	}, [id, orderProductVariantId, isOrderProductVariantValid, router]);

	const { data: res, isLoading, error } = useGetTemplateById(id ?? "");

	if (!id || !orderProductVariantId || !isOrderProductVariantValid) {
		return <FullscreenLoader label="Validating access…" delayMs={0} />;
	}

	if (isLoading) return <FullscreenLoader label="Loading template..." />;
	if (error) throw error;
	if (!res) {
		router.back();
		return <FullscreenLoader label="Template not found" />;
	}
	if (!res.success) {
		router.back();
		return <FullscreenLoader label={res.message || "Template not found"} />;
	}
	if (!res.data?.template) {
		router.back();
		return <FullscreenLoader label="Template data not found" />;
	}

	const { template } = res.data;

	return (
		<TemplateEditor
			original={template}
			orderProductVariantId={orderProductVariantId}
		/>
	);
}
