import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SupportTicketCompany {
  id: number;
  store_code: string;
}

export interface SupportTicketAdmin {
  id: number;
  name: string;
}

export interface SupportTicket {
  id: number;
  uuid: string;
  subject: string;
  status: "open" | "in_progress" | "closed";
  status_label: string;
  opened_by: "admin" | "seller";
  company: SupportTicketCompany;
  assigned_admin: SupportTicketAdmin | null;
  messages_count: number;
  unread_count: number;
  last_message_at: string | null;
  created_at: string;
}

export interface SupportMessage {
  id: number;
  body: string;
  sender_type: "admin" | "seller";
  sender_name: string;
  files: Array<{
    id: number;
    url: string;
    name: string;
    size: number;
  }>;
  is_read_by_seller: boolean;
  is_read_by_admin: boolean;
  created_at: string;
}

export interface SupportTicketDetail extends SupportTicket {
  messages: SupportMessage[];
}

export interface SupportStatus {
  id: string;
  title: string;
}

export interface SupportFiltersData {
  statuses: SupportStatus[];
}

interface SupportTicketsResponse {
  data: SupportTicket[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

export interface SupportTicketsFilters {
  page?: number;
  status?: string;
  company_id?: number | string;
  assigned_to_admin_id?: number | string;
  search?: string;
  limit?: number;
}

// ─── API Functions ────────────────────────────────────────────────────────────

async function getSupportTickets(filters: SupportTicketsFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });
  const response = await controlPrivateApi.get(
    `/support/load?${queryParams}`,
  );
  return response.data as SupportTicketsResponse;
}

async function getSupportFilters() {
  const response = await controlPrivateApi.get("/support/filters");
  return response.data.data as SupportFiltersData;
}

async function getSupportTicket(id: number) {
  const response = await controlPrivateApi.get(`/support/show/${id}`);
  return response.data.data as SupportTicketDetail;
}

async function createSupportTicket(data: FormData) {
  const response = await controlPrivateApi.post("/support/add", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

async function replySupportTicket(id: number, data: FormData) {
  const response = await controlPrivateApi.post(`/support/reply/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

async function assignSupportTicket(id: number, adminId: number) {
  const response = await controlPrivateApi.post(`/support/assign/${id}`, {
    admin_id: adminId,
  });
  return response.data;
}

async function closeSupportTicket(id: number) {
  const response = await controlPrivateApi.post(`/support/close/${id}`);
  return response.data;
}

// ─── Query Options ────────────────────────────────────────────────────────────

export const supportTicketsQueryOptions = (filters: SupportTicketsFilters) =>
  queryOptions({
    queryKey: ["supportTickets", filters],
    queryFn: () => getSupportTickets(filters),
    staleTime: 30 * 1000,
  });

export const supportFiltersQueryOptions = () =>
  queryOptions({
    queryKey: ["supportFilters"],
    queryFn: getSupportFilters,
    staleTime: 5 * 60 * 1000,
  });

export const supportTicketQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["supportTicket", id],
    queryFn: () => getSupportTicket(id),
    enabled: !!id,
  });

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useSupportTickets(filters: SupportTicketsFilters) {
  return useQuery(supportTicketsQueryOptions(filters));
}

export function useSupportFilters() {
  return useQuery(supportFiltersQueryOptions());
}

export function useSupportTicket(id: number) {
  return useQuery(supportTicketQueryOptions(id));
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSupportTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supportTickets"] });
    },
  });
}

export function useReplySupportTicket(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => replySupportTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supportTicket", id] });
      queryClient.invalidateQueries({ queryKey: ["supportTickets"] });
    },
  });
}

export function useAssignSupportTicket(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (adminId: number) => assignSupportTicket(id, adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supportTicket", id] });
      queryClient.invalidateQueries({ queryKey: ["supportTickets"] });
    },
  });
}

export function useCloseSupportTicket(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => closeSupportTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supportTicket", id] });
      queryClient.invalidateQueries({ queryKey: ["supportTickets"] });
    },
  });
}

// ─── Admin list for assign dropdown ──────────────────────────────────────────

export interface AdminListItem {
  id: number;
  name: string;
  surname: string | null;
  username: string;
  email: string;
}

async function getAdminsList() {
  const response = await controlPrivateApi.get("/admins/list");
  return response.data.data as AdminListItem[];
}

export const adminsListQueryOptions = () =>
  queryOptions({
    queryKey: ["adminsList"],
    queryFn: getAdminsList,
    staleTime: 5 * 60 * 1000,
  });

export function useAdminsList() {
  return useQuery(adminsListQueryOptions());
}
