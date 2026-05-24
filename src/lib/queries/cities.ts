import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

export interface CityListItem {
  id: number;
  title: string;
  sort: number;
  is_active: boolean;
  created_user: string;
  created_date: string;
}

export interface CityDetail {
  id: number;
  sort?: number;
  translations: Array<{
    language_id: number;
    title: string;
  }>;
}

export interface CitiesFilters {
  page: number;
  search?: string;
}

interface CitiesResponse {
  data: Array<CityListItem>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

interface TranslationsPayload {
  translations: Array<{
    language_id: number;
    title: string;
  }>;
}

function appendTranslations(
  formData: FormData,
  translations: TranslationsPayload["translations"],
) {
  translations.forEach((translation, index) => {
    formData.append(
      `translations[${index}][language_id]`,
      String(translation.language_id),
    );
    formData.append(`translations[${index}][title]`, translation.title);
  });
}

async function getCities(countryId: number, filters: CitiesFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });
  const response = await controlPrivateApi.get(
    `/countries/${countryId}/cities/load?${queryParams}`,
  );
  return response.data as CitiesResponse;
}

async function getCity(countryId: number, cityId: number) {
  const response = await controlPrivateApi.get(
    `/countries/${countryId}/cities/show/${cityId}`,
  );
  return response.data.data as CityDetail;
}

async function createCity(countryId: number, data: TranslationsPayload) {
  const formData = new FormData();
  appendTranslations(formData, data.translations);
  const response = await controlPrivateApi.post(
    `/countries/${countryId}/cities/add`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
}

async function updateCity(
  countryId: number,
  cityId: number,
  data: TranslationsPayload,
) {
  const formData = new FormData();
  appendTranslations(formData, data.translations);
  const response = await controlPrivateApi.post(
    `/countries/${countryId}/cities/update/${cityId}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
}

async function deleteCity(countryId: number, cityId: number) {
  const response = await controlPrivateApi.delete(
    `/countries/${countryId}/cities/delete/${cityId}`,
  );
  return response.data;
}

async function toggleCityStatus(countryId: number, cityId: number) {
  const response = await controlPrivateApi.post(
    `/countries/${countryId}/cities/change-active-status/${cityId}`,
  );
  return response.data;
}

async function changeCitySorting(
  countryId: number,
  cityId: number,
  sort: number,
) {
  const response = await controlPrivateApi.post(
    `/countries/${countryId}/cities/change-sorting/${cityId}`,
    { sort },
  );
  return response.data;
}

export const citiesQueryOptions = (
  countryId: number,
  filters: CitiesFilters,
) =>
  queryOptions({
    queryKey: ["cities", countryId, "admin", filters],
    queryFn: () => getCities(countryId, filters),
    enabled: !!countryId,
  });

export const cityQueryOptions = (countryId: number, cityId: number) =>
  queryOptions({
    queryKey: ["city", countryId, cityId],
    queryFn: () => getCity(countryId, cityId),
    enabled: !!countryId && !!cityId,
  });

export function useCitiesAdmin(countryId: number, filters: CitiesFilters) {
  return useQuery(citiesQueryOptions(countryId, filters));
}

export function useCity(countryId: number, cityId: number) {
  return useQuery(cityQueryOptions(countryId, cityId));
}

export function useCreateCity(countryId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TranslationsPayload) => createCity(countryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities", countryId] });
    },
  });
}

export function useUpdateCity(countryId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      cityId,
      data,
    }: {
      cityId: number;
      data: TranslationsPayload;
    }) => updateCity(countryId, cityId, data),
    onSuccess: (_, { cityId }) => {
      queryClient.invalidateQueries({ queryKey: ["cities", countryId] });
      queryClient.invalidateQueries({ queryKey: ["city", countryId, cityId] });
    },
  });
}

export function useDeleteCity(countryId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cityId: number) => deleteCity(countryId, cityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities", countryId] });
    },
  });
}

export function useToggleCityStatus(countryId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cityId: number) => toggleCityStatus(countryId, cityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities", countryId] });
    },
  });
}

export function useChangeCitySorting(countryId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cityId, sort }: { cityId: number; sort: number }) =>
      changeCitySorting(countryId, cityId, sort),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities", countryId] });
    },
  });
}
