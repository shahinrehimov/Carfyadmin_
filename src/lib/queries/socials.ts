import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

export interface Social {
  id: number;
  title: string;
  url: string;
  image: string | null;
  created_user: string;
  created_date: string;
}

interface SocialsResponse {
  data: Array<Social>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

interface CreateSocialRequest {
  title: string;
  url: string;
  image: File;
}

interface UpdateSocialRequest {
  title: string;
  url: string;
  image?: File;
}

interface SocialsFilters {
  page: number;
}

async function getSocials(filters: SocialsFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(`/socials/load?${queryParams}`);
  return response.data as SocialsResponse;
}

async function getSocial(id: number) {
  const response = await controlPrivateApi.get(`/socials/show/${id}`);
  return response.data.data as Social;
}

async function createSocial(data: CreateSocialRequest) {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("url", data.url);
  formData.append("image", data.image);

  const response = await controlPrivateApi.post("/socials/add", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

async function updateSocial(id: number, data: UpdateSocialRequest) {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("url", data.url);
  if (data.image) formData.append("image", data.image);

  const response = await controlPrivateApi.post(`/socials/update/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

async function deleteSocial(id: number) {
  const response = await controlPrivateApi.delete(`/socials/delete/${id}`);
  return response.data;
}

export const socialsQueryOptions = (filters: SocialsFilters) =>
  queryOptions({
    queryKey: ["socials", filters],
    queryFn: () => getSocials(filters),
    staleTime: 5 * 60 * 1000,
  });

export const socialQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["social", id],
    queryFn: () => getSocial(id),
    enabled: !!id,
  });

export function useSocials(filters: SocialsFilters) {
  return useQuery(socialsQueryOptions(filters));
}

export function useSocial(id: number) {
  return useQuery(socialQueryOptions(id));
}

export function useCreateSocial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSocial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socials"] });
    },
  });
}

export function useUpdateSocial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSocialRequest }) => updateSocial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socials"] });
    },
  });
}

export function useDeleteSocial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSocial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socials"] });
    },
  });
}
