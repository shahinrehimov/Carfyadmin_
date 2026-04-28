import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// Types
export interface Advertisement {
  id: number;
  title: string;
  key: string;
  link: string;
  image_url: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_currently_active: boolean;
  platform: "site" | "app" | "both";
  click_count: number;
  created_user: string;
  created_date: string;
}

export interface AdvertisementDetail extends Advertisement {
  description: string | null;
  updated_date: string | null;
}

export interface AdvertisementClick {
  id: number;
  user_type: "authenticated" | "guest" | "anonymous";
  user_id: number | null;
  guest_identifier: string | null;
  ip_address: string;
  user_agent: string;
  clicked_at: string;
}

interface AdvertisementsResponse {
  data: Array<Advertisement>;
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

interface AdvertisementClicksResponse {
  data: Array<AdvertisementClick>;
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

export interface AdvertisementsFilters {
  page: number;
  search?: string;
  limit?: number;
  platform?: string;
  is_active?: boolean;
  is_currently_active?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface AdvertisementClicksFilters {
  page: number;
  limit?: number;
  date_from?: string;
  date_to?: string;
  user_type?: string;
}

interface CreateAdvertisementRequest {
  title: string;
  description?: string;
  link: string;
  start_date: string;
  end_date: string;
  is_active?: number;
  platform: string;
  image?: File;
}

interface UpdateAdvertisementRequest {
  title?: string;
  description?: string;
  link?: string;
  start_date?: string;
  end_date?: string;
  is_active?: number;
  platform?: string;
  image?: File;
}

// API functions
async function getAdvertisements(filters: AdvertisementsFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });
  const response = await controlPrivateApi.get(
    `/advertisements/load?${queryParams}`,
  );
  return response.data as AdvertisementsResponse;
}

async function getAdvertisement(id: number) {
  const response = await controlPrivateApi.get(`/advertisements/show/${id}`);
  return response.data.data as AdvertisementDetail;
}

async function createAdvertisement(data: CreateAdvertisementRequest) {
  const formData = new FormData();
  formData.append("title", data.title);
  if (data.description) formData.append("description", data.description);
  formData.append("link", data.link);
  formData.append("start_date", data.start_date);
  formData.append("end_date", data.end_date);
  if (data.is_active !== undefined)
    formData.append("is_active", String(data.is_active));
  formData.append("platform", data.platform);
  if (data.image) formData.append("image", data.image);

  const response = await controlPrivateApi.post(
    "/advertisements/add",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
}

async function updateAdvertisement(
  id: number,
  data: UpdateAdvertisementRequest,
) {
  const formData = new FormData();
  if (data.title !== undefined) formData.append("title", data.title);
  if (data.description !== undefined)
    formData.append("description", data.description);
  if (data.link !== undefined) formData.append("link", data.link);
  if (data.start_date !== undefined)
    formData.append("start_date", data.start_date);
  if (data.end_date !== undefined) formData.append("end_date", data.end_date);
  if (data.is_active !== undefined)
    formData.append("is_active", String(data.is_active));
  if (data.platform !== undefined) formData.append("platform", data.platform);
  if (data.image) formData.append("image", data.image);

  const response = await controlPrivateApi.post(
    `/advertisements/update/${id}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
}

async function deleteAdvertisement(id: number) {
  const response = await controlPrivateApi.delete(
    `/advertisements/delete/${id}`,
  );
  return response.data;
}

async function toggleAdvertisementStatus(id: number) {
  const response = await controlPrivateApi.post(
    `/advertisements/change-active-status/${id}`,
  );
  return response.data;
}

async function getAdvertisementClicks(
  id: number,
  filters: AdvertisementClicksFilters,
) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });
  const response = await controlPrivateApi.get(
    `/advertisements/clicks/${id}?${queryParams}`,
  );
  return response.data as AdvertisementClicksResponse;
}

// Query options
export const advertisementsQueryOptions = (filters: AdvertisementsFilters) =>
  queryOptions({
    queryKey: ["advertisements", filters],
    queryFn: () => getAdvertisements(filters),
    staleTime: 5 * 60 * 1000,
  });

export const advertisementQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["advertisement", id],
    queryFn: () => getAdvertisement(id),
    enabled: !!id,
  });

export const advertisementClicksQueryOptions = (
  id: number,
  filters: AdvertisementClicksFilters,
) =>
  queryOptions({
    queryKey: ["advertisementClicks", id, filters],
    queryFn: () => getAdvertisementClicks(id, filters),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });

// Hooks
export function useAdvertisements(filters: AdvertisementsFilters) {
  return useQuery(advertisementsQueryOptions(filters));
}

export function useAdvertisement(id: number) {
  return useQuery(advertisementQueryOptions(id));
}

export function useAdvertisementClicks(
  id: number,
  filters: AdvertisementClicksFilters,
) {
  return useQuery(advertisementClicksQueryOptions(id, filters));
}

export function useCreateAdvertisement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdvertisement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advertisements"] });
    },
  });
}

export function useUpdateAdvertisement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateAdvertisementRequest;
    }) => updateAdvertisement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advertisements"] });
      queryClient.invalidateQueries({ queryKey: ["advertisement"] });
    },
  });
}

export function useDeleteAdvertisement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdvertisement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advertisements"] });
    },
  });
}

export function useToggleAdvertisementStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleAdvertisementStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advertisements"] });
    },
  });
}
