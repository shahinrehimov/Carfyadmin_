import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

export interface CarColor {
  id: number;
  title: string;
  hex_code: string;
  sort: number;
  is_active: boolean;
  created_user: string;
  created_date: string;
  translations?: Array<{
    language_id: number;
    title: string;
  }>;
}

interface CarColorsResponse {
  data: Array<CarColor>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

interface CarColorPayload {
  hex_code: string;
  sort?: number;
  translations: Array<{
    language_id: number;
    title: string;
  }>;
}

interface CarColorsFilters {
  page: number;
  search?: string;
}

async function getCarColors(filters: CarColorsFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });
  const response = await controlPrivateApi.get(
    `/car-colors/load?${queryParams}`,
  );
  return response.data as CarColorsResponse;
}

async function getCarColor(id: number) {
  const response = await controlPrivateApi.get(`/car-colors/show/${id}`);
  return response.data.data as CarColor;
}

async function createCarColor(data: CarColorPayload) {
  const response = await controlPrivateApi.post("/car-colors/add", data);
  return response.data;
}

async function updateCarColor(id: number, data: CarColorPayload) {
  const response = await controlPrivateApi.post(
    `/car-colors/update/${id}`,
    data,
  );
  return response.data;
}

async function deleteCarColor(id: number) {
  const response = await controlPrivateApi.delete(`/car-colors/delete/${id}`);
  return response.data;
}

async function toggleCarColorStatus(id: number) {
  const response = await controlPrivateApi.post(
    `/car-colors/change-active-status/${id}`,
  );
  return response.data;
}

async function changeCarColorSorting(id: number, sort: number) {
  const response = await controlPrivateApi.post(
    `/car-colors/change-sorting/${id}`,
    { sort },
  );
  return response.data;
}

export const carColorsQueryOptions = (filters: CarColorsFilters) =>
  queryOptions({
    queryKey: ["carColors", filters],
    queryFn: () => getCarColors(filters),
    staleTime: 5 * 60 * 1000,
  });

export const carColorQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["carColor", id],
    queryFn: () => getCarColor(id),
    enabled: !!id,
  });

export function useCarColors(filters: CarColorsFilters) {
  return useQuery(carColorsQueryOptions(filters));
}

export function useCarColor(id: number) {
  return useQuery(carColorQueryOptions(id));
}

export function useCreateCarColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCarColor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carColors"] });
    },
  });
}

export function useUpdateCarColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CarColorPayload }) =>
      updateCarColor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carColors"] });
    },
  });
}

export function useDeleteCarColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCarColor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carColors"] });
    },
  });
}

export function useToggleCarColorStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleCarColorStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carColors"] });
    },
  });
}

export function useChangeCarColorSorting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sort }: { id: number; sort: number }) =>
      changeCarColorSorting(id, sort),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carColors"] });
    },
  });
}
