import TemplateCreator from "@/features/editor/containers/template-creator";

export default function EdjtTemplateCreatorPage({
	params,
}: { params: { id: string } }) {
	const { id } = params;
	return <TemplateCreator templateId={id} />;
}
