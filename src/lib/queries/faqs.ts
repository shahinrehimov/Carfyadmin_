import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

export interface Faq {
  id: number;
  question: string;
  answer: string;
  sort: number;
  is_active: boolean;
  created_user: string;
  created_date: string;
}

export interface FaqTranslation {
  language_id: number;
  question: string;
  answer: string;
}

export interface FaqDetail {
  id: number;
  translations: FaqTranslation[];
  sort: number;
  is_active: boolean;
}

interface FaqsResponse {
  data: Faq[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page?: number;
  };
}

interface FaqsFilters {
  page: number;
  search?: string;
}

interface FaqPayload {
  sort: number;
  translations: FaqTranslation[];
}

function appendTranslations(formData: FormData, translations: FaqTranslation[]) {
  translations.forEach((translation, index) => {
    formData.append(
      `translations[${index}][language_id]`,
      String(translation.language_id),
    );
    formData.append(`translations[${index}][question]`, translation.question);
    formData.append(`translations[${index}][answer]`, translation.answer);
  });
}

async function getFaqs(filters: FaqsFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(`/faqs/load?${queryParams}`);
  return response.data as FaqsResponse;
}

async function getFaq(id: number) {
  const response = await controlPrivateApi.get(`/faqs/show/${id}`);
  return (response.data.data ?? response.data) as FaqDetail;
}

async function createFaq(data: FaqPayload) {
  const formData = new FormData();
  formData.append("sort", String(data.sort));
  appendTranslations(formData, data.translations);

  const response = await controlPrivateApi.post("/faqs/add", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

async function updateFaq(id: number, data: FaqPayload) {
  const formData = new FormData();
  formData.append("sort", String(data.sort));
  appendTranslations(formData, data.translations);

  const response = await controlPrivateApi.post(`/faqs/update/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

async function deleteFaq(id: number) {
  const response = await controlPrivateApi.delete(`/faqs/delete/${id}`);
  return response.data;
}

async function toggleFaqStatus(id: number) {
  const response = await controlPrivateApi.post(
    `/faqs/change-active-status/${id}`,
  );
  return response.data;
}

async function changeFaqSorting(id: number, sort: number) {
  const response = await controlPrivateApi.post(`/faqs/change-sorting/${id}`, {
    sort,
  });
  return response.data;
}

export const faqsQueryOptions = (filters: FaqsFilters) =>
  queryOptions({
    queryKey: ["faqs", filters],
    queryFn: () => getFaqs(filters),
  });

export const faqQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["faq", id],
    queryFn: () => getFaq(id),
    enabled: !!id,
  });

export function useFaqs(filters: FaqsFilters) {
  return useQuery(faqsQueryOptions(filters));
}

export function useFaq(id: number) {
  return useQuery(faqQueryOptions(id));
}

async function invalidateFaqsList(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: ["faqs"] });
}

export function useCreateFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFaq,
    onSuccess: async () => {
      await invalidateFaqsList(queryClient);
    },
  });
}

export function useUpdateFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FaqPayload }) =>
      updateFaq(id, data),
    onSuccess: async () => {
      await invalidateFaqsList(queryClient);
      await queryClient.invalidateQueries({ queryKey: ["faq"] });
    },
  });
}

export function useDeleteFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFaq,
    onSuccess: async () => {
      await invalidateFaqsList(queryClient);
    },
  });
}

export function useToggleFaqStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleFaqStatus,
    onSuccess: async () => {
      await invalidateFaqsList(queryClient);
    },
  });
}

export function useChangeFaqSorting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, sort }: { id: number; sort: number }) =>
      changeFaqSorting(id, sort),
    onSuccess: async () => {
      await invalidateFaqsList(queryClient);
    },
  });
}
