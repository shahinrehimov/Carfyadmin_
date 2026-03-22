import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

export interface BrandModelListItem {
  id: number;
  title: string;
  created_user?: string;
  created_date?: string;
}

export interface BrandModelDetail {
  id: number;
  translations: Array<{
    language_id: number;
    title: string;
  }>;
}

interface MutateTranslations {
  translations: Array<{
    language_id: number;
    title: string;
  }>;
}

export interface BrandModelsFilters {
  page: number;
  search?: string;
}

interface BrandModelsResponse {
  data: BrandModelListItem[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

function normalizeLoadResponse(payload: unknown): BrandModelsResponse {
  if (!payload || typeof payload !== "object") {
    return {
      data: [],
      meta: { current_page: 1, per_page: 10, total: 0 },
    };
  }
  const p = payload as {
    data?: unknown;
    meta?: BrandModelsResponse["meta"];
  };
  const data = Array.isArray(p.data)
    ? (p.data as BrandModelListItem[])
    : [];
  const meta = p.meta ?? {
    current_page: 1,
    per_page: data.length || 10,
    total: data.length,
  };
  return { data, meta };
}

async function getBrandModels(brandId: number, filters: BrandModelsFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(
    `/brands/${brandId}/models/load?${queryParams}`,
  );
  return normalizeLoadResponse(response.data);
}

async function getBrandModel(brandId: number, modelId: number) {
  const response = await controlPrivateApi.get(
    `/brands/${brandId}/models/show/${modelId}`,
  );
  const raw = response.data?.data ?? response.data;
  return raw as BrandModelDetail;
}

function appendTranslations(
  formData: FormData,
  translations: MutateTranslations["translations"],
) {
  translations.forEach((translation, index) => {
    formData.append(
      `translations[${index}][language_id]`,
      String(translation.language_id),
    );
    formData.append(`translations[${index}][title]`, translation.title);
  });
}

async function createBrandModel(brandId: number, data: MutateTranslations) {
  const formData = new FormData();
  appendTranslations(formData, data.translations);
  const response = await controlPrivateApi.post(
    `/brands/${brandId}/models/add`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
}

async function updateBrandModel(
  brandId: number,
  modelId: number,
  data: MutateTranslations,
) {
  const formData = new FormData();
  appendTranslations(formData, data.translations);
  const response = await controlPrivateApi.post(
    `/brands/${brandId}/models/update/${modelId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
}

async function deleteBrandModel(brandId: number, modelId: number) {
  const response = await controlPrivateApi.delete(
    `/brands/${brandId}/models/delete/${modelId}`,
  );
  return response.data;
}

export const brandModelsQueryOptions = (
  brandId: number,
  filters: BrandModelsFilters,
) =>
  queryOptions({
    queryKey: ["brandModels", brandId, filters],
    queryFn: () => getBrandModels(brandId, filters),
    enabled: !!brandId,
  });

export const brandModelQueryOptions = (brandId: number, modelId: number) =>
  queryOptions({
    queryKey: ["brandModel", brandId, modelId],
    queryFn: () => getBrandModel(brandId, modelId),
    enabled: !!brandId && !!modelId,
  });

export function useBrandModels(brandId: number, filters: BrandModelsFilters) {
  return useQuery(brandModelsQueryOptions(brandId, filters));
}

export function useBrandModel(brandId: number, modelId: number) {
  return useQuery(brandModelQueryOptions(brandId, modelId));
}

export function useCreateBrandModel(brandId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MutateTranslations) => createBrandModel(brandId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brandModels", brandId] });
    },
  });
}

export function useUpdateBrandModel(brandId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      modelId,
      data,
    }: {
      modelId: number;
      data: MutateTranslations;
    }) => updateBrandModel(brandId, modelId, data),
    onSuccess: (_, { modelId }) => {
      queryClient.invalidateQueries({ queryKey: ["brandModels", brandId] });
      queryClient.invalidateQueries({
        queryKey: ["brandModel", brandId, modelId],
      });
    },
  });
}

export function useDeleteBrandModel(brandId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (modelId: number) => deleteBrandModel(brandId, modelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brandModels", brandId] });
    },
  });
}
