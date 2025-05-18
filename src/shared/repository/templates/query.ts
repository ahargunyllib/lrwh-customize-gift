import type { TemplateEntity } from "@/shared/types/template";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	createTemplate,
	getTemplateById,
	getTemplates,
	updateTemplate,
} from "./action";
import type { CreateTemplateRequest } from "./dto";

export const useGetTemplatesQuery = () => {
	return useQuery({
		queryKey: ["templates"],
		queryFn: () => getTemplates(),
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
				toast.error(res.message);
				return;
			}

			toast.success(res.message);

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
				toast.error(res.message);
				return;
			}

			toast.success(res.message);

			queryClient.invalidateQueries({ queryKey: ["templates"] });
		},
	});
};
