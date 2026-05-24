import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

export interface CountryOption {
  id: number;
  title: string;
}

export interface CityOption {
  id: number;
  title: string;
}

export interface CountryListItem {
  id: number;
  title: string;
  sort: number;
  is_active: boolean;
  created_user: string;
  created_date: string;
}

export interface CountryDetail {
  id: number;
  sort?: number;
  translations: Array<{
    language_id: number;
    title: string;
  }>;
}

export interface CountriesFilters {
  page: number;
  search?: string;
}

interface CountriesResponse {
  data: Array<CountryListItem>;
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

async function getCountriesList() {
  const response = await controlPrivateApi.get("/countries/list");
  return response.data.data as CountryOption[];
}

async function getCitiesList(countryId: number) {
  const response = await controlPrivateApi.get(
    `/countries/${countryId}/cities/list`,
  );
  return response.data.data as CityOption[];
}

async function getCountries(filters: CountriesFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });
  const response = await controlPrivateApi.get(
    `/countries/load?${queryParams}`,
  );
  return response.data as CountriesResponse;
}

async function getCountry(id: number) {
  const response = await controlPrivateApi.get(`/countries/show/${id}`);
  return response.data.data as CountryDetail;
}

async function createCountry(data: TranslationsPayload) {
  const formData = new FormData();
  appendTranslations(formData, data.translations);
  const response = await controlPrivateApi.post("/countries/add", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

async function updateCountry(id: number, data: TranslationsPayload) {
  const formData = new FormData();
  appendTranslations(formData, data.translations);
  const response = await controlPrivateApi.post(
    `/countries/update/${id}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
}

async function deleteCountry(id: number) {
  const response = await controlPrivateApi.delete(`/countries/delete/${id}`);
  return response.data;
}

async function toggleCountryStatus(id: number) {
  const response = await controlPrivateApi.post(
    `/countries/change-active-status/${id}`,
  );
  return response.data;
}

async function changeCountrySorting(id: number, sort: number) {
  const response = await controlPrivateApi.post(
    `/countries/change-sorting/${id}`,
    { sort },
  );
  return response.data;
}

export const countriesListQueryOptions = queryOptions({
  queryKey: ["countries", "list"],
  queryFn: getCountriesList,
  staleTime: 10 * 60 * 1000,
});

export const citiesListQueryOptions = (countryId: number | null) =>
  queryOptions({
    queryKey: ["cities", countryId, "list"],
    queryFn: () => getCitiesList(countryId!),
    enabled: !!countryId,
    staleTime: 10 * 60 * 1000,
  });

export const countriesQueryOptions = (filters: CountriesFilters) =>
  queryOptions({
    queryKey: ["countries", "admin", filters],
    queryFn: () => getCountries(filters),
    staleTime: 5 * 60 * 1000,
  });

export const countryQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["country", id],
    queryFn: () => getCountry(id),
    enabled: !!id,
  });

export function useCountries() {
  return useQuery(countriesListQueryOptions);
}

export function useCities(countryId: number | null) {
  return useQuery(citiesListQueryOptions(countryId));
}

export function useCountriesAdmin(filters: CountriesFilters) {
  return useQuery(countriesQueryOptions(filters));
}

export function useCountry(id: number) {
  return useQuery(countryQueryOptions(id));
}

export function useCreateCountry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCountry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
    },
  });
}

export function useUpdateCountry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TranslationsPayload }) =>
      updateCountry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
    },
  });
}

export function useDeleteCountry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCountry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
    },
  });
}

export function useToggleCountryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleCountryStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
    },
  });
}

export function useChangeCountrySorting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sort }: { id: number; sort: number }) =>
      changeCountrySorting(id, sort),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
    },
  });
}
