import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

export interface ContactMessage {
  id: number;
  full_name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_date: string;
}

interface ContactMessagesResponse {
  data: Array<ContactMessage>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

interface ContactMessagesFilters {
  page: number;
  search?: string;
  is_read?: string;
}

async function getContactMessages(filters: ContactMessagesFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });
  const response = await controlPrivateApi.get(
    `/contact-messages/load?${queryParams}`,
  );
  return response.data as ContactMessagesResponse;
}

async function getContactMessage(id: number) {
  const response = await controlPrivateApi.get(`/contact-messages/show/${id}`);
  return response.data.data as ContactMessage;
}

async function markAsRead(id: number) {
  const response = await controlPrivateApi.post(
    `/contact-messages/mark-as-read/${id}`,
  );
  return response.data;
}

async function markAsUnread(id: number) {
  const response = await controlPrivateApi.post(
    `/contact-messages/mark-as-unread/${id}`,
  );
  return response.data;
}

async function deleteContactMessage(id: number) {
  const response = await controlPrivateApi.delete(
    `/contact-messages/delete/${id}`,
  );
  return response.data;
}

export const contactMessagesQueryOptions = (filters: ContactMessagesFilters) =>
  queryOptions({
    queryKey: ["contactMessages", filters],
    queryFn: () => getContactMessages(filters),
    staleTime: 5 * 60 * 1000,
  });

export const contactMessageQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["contactMessage", id],
    queryFn: () => getContactMessage(id),
    enabled: !!id,
  });

export function useContactMessages(filters: ContactMessagesFilters) {
  return useQuery(contactMessagesQueryOptions(filters));
}

export function useContactMessage(id: number) {
  return useQuery(contactMessageQueryOptions(id));
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contactMessages"] });
      queryClient.invalidateQueries({ queryKey: ["contactMessage"] });
    },
  });
}

export function useMarkAsUnread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAsUnread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contactMessages"] });
      queryClient.invalidateQueries({ queryKey: ["contactMessage"] });
    },
  });
}

export function useDeleteContactMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteContactMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contactMessages"] });
    },
  });
}
