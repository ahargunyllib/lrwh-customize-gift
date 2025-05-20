"use client";
import { useGetTemplateById } from "@/shared/repository/templates/query";
import dynamic from "next/dynamic";
import { use } from "react";

export default function TemplateEditorPage({
	params,
}: { params: Promise<{ id: string }> }) {
	const paramsValue = use(params);
	const TemplateEditor = dynamic(
		() =>
			import("../../../../features/editor/containers/template-editor").then(
				(m) => m.default,
			),
		{ ssr: false },
	);

	const { data: res, isLoading, error } = useGetTemplateById(paramsValue.id);

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>Error: {error.message}</div>;
	if (!res) return <div>No template found</div>;
	if (!res.success) return <div>Error: {res.message}</div>;
	if (!res.data) return <div>No template found</div>;

	const { template } = res.data;

	return <TemplateEditor original={template} />;
}
