import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// Types
export interface CompanyAdmin {
  id: number;
  username: string;
  email: string;
  name: string;
  surname: string;
  full_name: string;
  image: string | null;
  is_root: boolean;
  is_active: boolean;
  created_user: string | null;
  created_date: string;
}

export interface CompanyAdminDetails {
  id: number;
  company_id: number;
  username: string;
  email: string;
  name: string;
  surname: string;
  is_root: boolean;
  is_active: boolean;
  password_must_change: boolean;
  image: string | null;
  company: {
    id: number;
    uuid: string;
    title: string;
  };
}

interface CompanyAdminsResponse {
  data: Array<CompanyAdmin>;
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

interface CompanyAdminsFilters {
  page?: number;
  limit?: number;
  search?: string;
}

interface CreateCompanyAdminRequest {
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
  name: string;
  surname: string;
  is_root: boolean;
  is_active: boolean;
}

interface UpdateCompanyAdminRequest {
  username: string;
  email: string;
  name: string;
  surname: string;
  is_active: boolean;
}

// API functions
async function getCompanyAdmins(
  companyId: number,
  filters: CompanyAdminsFilters,
) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(
    `/companies/${companyId}/admins/load?${queryParams}`,
  );
  return response.data as CompanyAdminsResponse;
}

async function getCompanyAdmin(companyId: number, adminId: number) {
  const response = await controlPrivateApi.get(
    `/companies/${companyId}/admins/show/${adminId}`,
  );
  return response.data.data as CompanyAdminDetails;
}

async function createCompanyAdmin(
  companyId: number,
  data: CreateCompanyAdminRequest,
) {
  const response = await controlPrivateApi.post(
    `/companies/${companyId}/admins/add`,
    data,
  );
  return response.data;
}

async function updateCompanyAdmin(
  companyId: number,
  adminId: number,
  data: UpdateCompanyAdminRequest,
) {
  const response = await controlPrivateApi.post(
    `/companies/${companyId}/admins/update/${adminId}`,
    data,
  );
  return response.data;
}

async function deleteCompanyAdmin(companyId: number, adminId: number) {
  const response = await controlPrivateApi.delete(
    `/companies/${companyId}/admins/delete/${adminId}`,
  );
  return response.data;
}

async function getCompanyAdminsList(companyId: number) {
  const response = await controlPrivateApi.get(
    `/companies/${companyId}/admins/list`,
  );
  return response.data.data as Array<{ id: number; full_name: string; username: string }>;
}

async function toggleCompanyAdminStatus(
  companyId: number,
  adminId: number,
  isActive: boolean,
) {
  const response = await controlPrivateApi.post(
    `/companies/${companyId}/admins/change-active-status/${adminId}`,
    {
      is_active: !isActive,
    },
  );
  return response.data;
}

// Query options
export const companyAdminsQueryOptions = (
  companyId: number,
  filters: CompanyAdminsFilters,
) =>
  queryOptions({
    queryKey: ["company-admins", companyId, filters],
    queryFn: () => getCompanyAdmins(companyId, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!companyId,
  });

export const companyAdminQueryOptions = (companyId: number, adminId: number) =>
  queryOptions({
    queryKey: ["company-admin", companyId, adminId],
    queryFn: () => getCompanyAdmin(companyId, adminId),
    enabled: !!companyId && !!adminId,
  });

export const companyAdminsListQueryOptions = (companyId: number) =>
  queryOptions({
    queryKey: ["company-admins-list", companyId],
    queryFn: () => getCompanyAdminsList(companyId),
    staleTime: 5 * 60 * 1000,
    enabled: !!companyId,
  });

// Hooks
export function useCompanyAdmins(
  companyId: number,
  filters: CompanyAdminsFilters,
) {
  return useQuery(companyAdminsQueryOptions(companyId, filters));
}

export function useCompanyAdmin(companyId: number, adminId: number) {
  return useQuery(companyAdminQueryOptions(companyId, adminId));
}

export function useCompanyAdminsList(companyId: number) {
  return useQuery(companyAdminsListQueryOptions(companyId));
}

export function useCreateCompanyAdmin(companyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCompanyAdminRequest) =>
      createCompanyAdmin(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["company-admins", companyId],
      });
    },
  });
}

export function useUpdateCompanyAdmin(companyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      adminId,
      data,
    }: {
      adminId: number;
      data: UpdateCompanyAdminRequest;
    }) => updateCompanyAdmin(companyId, adminId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["company-admins", companyId],
      });
    },
  });
}

export function useDeleteCompanyAdmin(companyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (adminId: number) => deleteCompanyAdmin(companyId, adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["company-admins", companyId],
      });
    },
  });
}

export function useToggleCompanyAdminStatus(companyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      adminId,
      isActive,
    }: {
      adminId: number;
      isActive: boolean;
    }) => toggleCompanyAdminStatus(companyId, adminId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["company-admins", companyId],
      });
    },
  });
}

