"use client";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

export default function TemplateEditorPage() {
	const params = useParams();
	const TemplateEditor = dynamic(
		() =>
			import("../../../../features/editor/containers/template-editor").then(
				(m) => m.default,
			),
		{ ssr: false },
	);
	return (
		<TemplateEditor
			templateId={Array.isArray(params.id) ? params.id[0] : (params.id ?? "")}
		/>
	);
}
