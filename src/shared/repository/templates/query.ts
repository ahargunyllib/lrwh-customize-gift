import type { TemplateEntity } from "@/shared/types/template";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProductVariant } from "../../types";
import {
	createTemplate,
	getTemplateById,
	getTemplates,
	updateTemplate,
} from "./action";
import type { CreateTemplateRequest } from "./dto";

export const useGetTemplatesQuery = (query?: {
	productVariantId?: ProductVariant["id"];
	page?: number;
}) => {
	return useQuery({
		queryKey: ["templates", query],
		queryFn: () => getTemplates(query),
	});
};

export const useGetTemplateById = (id: TemplateEntity["id"]) => {
	return useQuery({
		queryKey: ["templates", id],
		queryFn: () => getTemplateById(id),
	});
};

export const useCreateTemplateMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateTemplateRequest) => createTemplate(data),
		onSuccess: (res) => {
			if (!res.success) {
				return;
			}

			queryClient.invalidateQueries({ queryKey: ["templates"] });
		},
	});
};

export const useUpdateTemplateMutation = (id: TemplateEntity["id"]) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateTemplateRequest) => updateTemplate(data, id),
		onSuccess: (res) => {
			if (!res.success) {
				return;
			}

			queryClient.invalidateQueries({ queryKey: ["templates"] });
		},
	});
};
