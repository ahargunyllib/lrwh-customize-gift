import type { TemplateData } from "@/shared/types/template";

const getTemplateById = (id: string) => {
	const templates = JSON.parse(localStorage.getItem("customTemplates") || "[]");
	const template = templates.find((template: TemplateData) => {
		return template.id === id;
	});

	return template;
};

export { getTemplateById };
