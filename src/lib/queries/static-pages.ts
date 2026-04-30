import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

export interface StaticPageTranslation {
  language_id: number;
  title?: string;
  description?: string;
  body?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
}

export interface StaticPage {
  id: number;
  slug: string;
  sort: number;
  is_active: boolean;
  main_image?: string;
  icon?: string;
  images?: {
    urls: string[];
    media_ids: number[];
  };
  translations: StaticPageTranslation[];
  created_date?: string;
}

interface StaticPagesResponse {
  data: StaticPage[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

interface StaticPagesFilters {
  page: number;
  limit?: number;
  search?: string;
}

async function getStaticPages(filters: StaticPagesFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      params.append(key, String(value));
    }
  });
  const response = await controlPrivateApi.get(`/pages/load?${params}`);
  return response.data as StaticPagesResponse;
}

async function getStaticPage(id: number) {
  const response = await controlPrivateApi.get(`/pages/show/${id}`);
  return response.data.data as StaticPage;
}

async function addStaticPage(formData: FormData) {
  const response = await controlPrivateApi.post("/pages/add", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

async function updateStaticPage({
  id,
  formData,
}: {
  id: number;
  formData: FormData;
}) {
  const response = await controlPrivateApi.post(
    `/pages/update/${id}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
}

async function deleteStaticPage(id: number) {
  const response = await controlPrivateApi.delete(`/pages/delete/${id}`);
  return response.data;
}

async function togglePageStatus(id: number) {
  const response = await controlPrivateApi.post(
    `/pages/change-active-status/${id}`,
  );
  return response.data;
}

async function deletePageImage({
  pageId,
  mediaId,
}: {
  pageId: number;
  mediaId: number;
}) {
  const response = await controlPrivateApi.delete(
    `/pages/images/delete/${pageId}/${mediaId}`,
  );
  return response.data;
}

export const staticPagesQueryOptions = (filters: StaticPagesFilters) =>
  queryOptions({
    queryKey: ["staticPages", filters],
    queryFn: () => getStaticPages(filters),
  });

export const staticPageQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["staticPage", id],
    queryFn: () => getStaticPage(id),
    enabled: !!id,
  });

export function useStaticPages(filters: StaticPagesFilters) {
  return useQuery(staticPagesQueryOptions(filters));
}

export function useStaticPage(id: number) {
  return useQuery(staticPageQueryOptions(id));
}

export function useAddStaticPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addStaticPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staticPages"] });
    },
  });
}

export function useUpdateStaticPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateStaticPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staticPages"] });
      queryClient.invalidateQueries({ queryKey: ["staticPage"] });
    },
  });
}

export function useDeleteStaticPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteStaticPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staticPages"] });
    },
  });
}

export function useTogglePageStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: togglePageStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staticPages"] });
    },
  });
}

export function useDeletePageImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePageImage,
    onSuccess: (_, { pageId }) => {
      queryClient.invalidateQueries({ queryKey: ["staticPage", pageId] });
    },
  });
}
