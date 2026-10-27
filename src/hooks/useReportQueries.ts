import { queryKeys } from "@/api/queryKeys";
import { reportImageService, reportService, type CreateReportPayload, type Report, type AiWasteScanResult } from "@/api/services/reportService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ============================================================
// Report Queries
// ============================================================

/** GET /api/report/reports/ */
export const useReports = (filters?: Record<string, unknown>) => {
	return useQuery({
		queryKey: queryKeys.reports.list(filters),
		queryFn: () => reportService.getAll(filters),
	});
};

/** GET /api/report/reports/{id}/ */
export const useReport = (id: string) => {
	return useQuery({
		queryKey: queryKeys.reports.detail(id),
		queryFn: () => reportService.getById(id),
		enabled: !!id,
	});
};

/** GET /api/report-images/ */
export const useReportImages = (filters?: Record<string, unknown>) => {
	return useQuery({
		queryKey: queryKeys.reports.images.list(filters),
		queryFn: () => reportImageService.getAll(filters),
	});
};

// ============================================================
// Report Mutations
// ============================================================

/** POST /api/report/reports/ */
export const useCreateReport = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateReportPayload) => reportService.create(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.reports.lists() });
		},
		onError: (error: any) => {
			const errorMsg =
				error?.response?.data?.detail || error?.response?.data?.error || error?.message || "Failed to create report";
			console.error(errorMsg);
		},
	});
};

/** PATCH /api/report/reports/{id}/ */
export const useUpdateReport = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: Partial<Report> }) => reportService.update(id, payload),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.reports.lists() });
			queryClient.invalidateQueries({ queryKey: queryKeys.reports.detail(variables.id) });
		},
	});
};

/** DELETE /api/report/reports/{id}/ */
export const useDeleteReport = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => reportService.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.reports.lists() });
		},
	});
};

/** POST /api/report-images/ – Upload ảnh report */
export const useUploadReportImage = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (formData: FormData) => reportImageService.create(formData),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.reports.images.lists() });
		},
	});
};

/** POST /api/ai/scan – Giám định ảnh bằng AI */
export const useAiWasteScan = () => {
	return useMutation({
		mutationFn: (imageUri: string) => reportService.scanWasteImage(imageUri),
	});
};
