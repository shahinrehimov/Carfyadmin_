import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// Types
export interface Company {
  id: number;
  uuid: string;
  voen: string;
  phone: string;
  email: string;
  title: string;
  logo: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_user: string | null;
  created_date: string;
}

export interface WorkingHour {
  day_of_week: number;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
}

export interface CompanyDetails {
  id: number;
  uuid: string;
  voen: string;
  phone: string;
  email: string;
  city_id: number;
  city: { id: number; title: string; country_id: number } | null;
  latitude: string;
  longitude: string;
  website: string;
  root_admin_email: string;
  verified_at: string | null;
  is_active: boolean;
  logo: string | null;
  banner: string | null;
  translations: Array<{
    language_id: number;
    title: string;
    info: string;
    address: string;
  }>;
  working_hours: WorkingHour[];
  avg_rating: number | null;
  review_count: number;
}

interface CompaniesResponse {
  data: Array<Company>;
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

interface CreateCompanyRequest {
  voen: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  website: string;
  is_active: boolean;
  city_id: number;
  translations: Array<{
    language_id: number;
    title: string | null;
    info: string | null;
    address: string | null;
  }>;
  root_admin_username: string;
  root_admin_email: string;
  root_admin_name: string;
  root_admin_surname: string;
}

interface UpdateCompanyRequest {
  voen: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  website: string;
  is_active: boolean;
  translations: Array<{
    language_id: number;
    title: string | null;
    info: string | null;
    address: string | null;
  }>;
}

interface CompaniesFilters {
  page?: number;
  limit?: number;
  search?: string;
}

// API functions
async function getCompanies(filters: CompaniesFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(
    `/companies/load?${queryParams}`,
  );
  return response.data as CompaniesResponse;
}

async function getCompany(id: number) {
  const response = await controlPrivateApi.get(`/companies/show/${id}`);
  return response.data.data as CompanyDetails;
}

async function createCompany(data: CreateCompanyRequest) {
  const response = await controlPrivateApi.post("/companies/add", data);
  return response.data;
}

async function updateCompany(id: number, data: UpdateCompanyRequest) {
  const response = await controlPrivateApi.post(
    `/companies/update/${id}`,
    data,
  );
  return response.data;
}

async function deleteCompany(id: number) {
  const response = await controlPrivateApi.delete(`/companies/delete/${id}`);
  return response.data;
}

async function toggleCompanyStatus(id: number, isActive: boolean) {
  const response = await controlPrivateApi.post(
    `/companies/change-active-status/${id}`,
    {
      is_active: !isActive,
    },
  );
  return response.data;
}

async function verifyCompany(id: number) {
  const response = await controlPrivateApi.post(`/companies/verify/${id}`);
  return response.data;
}

async function deleteCompanyLogo(id: number) {
  const response = await controlPrivateApi.delete(`/companies/delete-logo/${id}`);
  return response.data;
}

async function deleteCompanyBanner(id: number) {
  const response = await controlPrivateApi.delete(`/companies/delete-banner/${id}`);
  return response.data;
}

async function updateWorkingHours(id: number, hours: WorkingHour[]) {
  const response = await controlPrivateApi.post(`/companies/working-hours/${id}`, { hours });
  return response.data;
}

async function getCompaniesList() {
  const response = await controlPrivateApi.get(`/companies/list`);
  return response.data.data as Array<{ id: number; uuid: string; title: string }>;
}

// Query options
export const companiesQueryOptions = (filters: CompaniesFilters) =>
  queryOptions({
    queryKey: ["companies", filters],
    queryFn: () => getCompanies(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

export const companyQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["company", id],
    queryFn: () => getCompany(id),
    enabled: !!id,
  });

export const companiesListQueryOptions = () =>
  queryOptions({
    queryKey: ["companiesList"],
    queryFn: () => getCompaniesList(),
    staleTime: 5 * 60 * 1000,
  });

// Hooks
export function useCompanies(filters: CompaniesFilters) {
  return useQuery(companiesQueryOptions(filters));
}

export function useCompaniesList() {
  return useQuery(companiesListQueryOptions());
}

export function useCompany(id: number) {
  return useQuery(companyQueryOptions(id));
}

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCompanyRequest }) =>
      updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}

export function useToggleCompanyStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleCompanyStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}

export function useVerifyCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}

export function useDeleteCompanyLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCompanyLogo,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["company", id] });
    },
  });
}

export function useDeleteCompanyBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCompanyBanner,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["company", id] });
    },
  });
}

export function useUpdateWorkingHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, hours }: { id: number; hours: WorkingHour[] }) =>
      updateWorkingHours(id, hours),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["company", id] });
    },
  });
}
