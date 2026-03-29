import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// Types
export interface ProductOption {
  id: number;
  title: string;
  is_required: boolean;
  has_items: boolean;
  is_translatable: boolean;
  can_multiple: boolean;
  sort: number;
  is_active: boolean;
  items_count: number;
  created_user: string;
  created_date: string;
}

export interface ProductOptionItem {
  id: number;
  product_option_id: number;
  title: string;
  sort: number;
  is_active: boolean;
  created_user: string;
  created_date: string;
}

interface ProductOptionsResponse {
  data: Array<ProductOption>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

interface ProductOptionItemsResponse {
  data: Array<ProductOptionItem>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

export interface CreateProductOptionRequest {
  translations: Array<{
    language_id: number;
    title: string;
  }>;
  is_required: boolean;
  has_items: boolean;
  is_translatable: boolean;
  can_multiple: boolean;
}

export interface UpdateProductOptionRequest {
  translations: Array<{
    language_id: number;
    title: string;
  }>;
  is_required: boolean;
  has_items: boolean;
  is_translatable: boolean;
  can_multiple: boolean;
}

export interface CreateProductOptionItemRequest {
  translations: Array<{
    language_id: number;
    title: string;
  }>;
}

export interface UpdateProductOptionItemRequest {
  translations: Array<{
    language_id: number;
    title: string;
  }>;
}

interface ProductOptionsFilters {
  page: number;
  search?: string;
}

interface ProductOptionItemsFilters {
  page: number;
  search?: string;
}

function buildTranslationsFormData(
  translations: Array<{ language_id: number; title: string }>,
  extra?: Record<string, boolean | number | string>
) {
  const formData = new FormData();
  translations.forEach((tr, i) => {
    formData.append(`translations[${i}][language_id]`, String(tr.language_id));
    formData.append(`translations[${i}][title]`, tr.title);
  });
  if (extra) {
    Object.entries(extra).forEach(([key, value]) => {
      formData.append(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value));
    });
  }
  return formData;
}

// API functions - Product Options
async function getProductOptions(filters: ProductOptionsFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });
  const response = await controlPrivateApi.get(`/product-options/load?${queryParams}`);
  return response.data as ProductOptionsResponse;
}

async function getProductOption(id: number) {
  const response = await controlPrivateApi.get(`/product-options/show/${id}`);
  return response.data.data as ProductOption;
}

async function createProductOption(data: CreateProductOptionRequest) {
  const formData = buildTranslationsFormData(data.translations, {
    is_required: data.is_required,
    has_items: data.has_items,
    is_translatable: data.is_translatable,
    can_multiple: data.can_multiple,
  });
  const response = await controlPrivateApi.post("/product-options/add", formData);
  return response.data;
}

async function updateProductOption(id: number, data: UpdateProductOptionRequest) {
  const formData = buildTranslationsFormData(data.translations, {
    is_required: data.is_required,
    has_items: data.has_items,
    is_translatable: data.is_translatable,
    can_multiple: data.can_multiple,
  });
  const response = await controlPrivateApi.post(`/product-options/update/${id}`, formData);
  return response.data;
}

async function deleteProductOption(id: number) {
  const response = await controlPrivateApi.delete(`/product-options/delete/${id}`);
  return response.data;
}

async function toggleProductOptionStatus(id: number) {
  const response = await controlPrivateApi.post(`/product-options/change-active-status/${id}`);
  return response.data;
}

async function changeProductOptionSorting(id: number, sort: number) {
  const response = await controlPrivateApi.post(`/product-options/change-sorting/${id}`, { sort });
  return response.data;
}

// API functions - Product Option Items
async function getProductOptionItems(productOptionId: number, filters: ProductOptionItemsFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });
  const response = await controlPrivateApi.get(
    `/product-options/${productOptionId}/items/load?${queryParams}`
  );
  return response.data as ProductOptionItemsResponse;
}

async function getProductOptionItem(productOptionId: number, id: number) {
  const response = await controlPrivateApi.get(
    `/product-options/${productOptionId}/items/show/${id}`
  );
  return response.data.data as ProductOptionItem;
}

async function createProductOptionItem(
  productOptionId: number,
  data: CreateProductOptionItemRequest
) {
  const formData = buildTranslationsFormData(data.translations);
  const response = await controlPrivateApi.post(
    `/product-options/${productOptionId}/items/add`,
    formData
  );
  return response.data;
}

async function updateProductOptionItem(
  productOptionId: number,
  id: number,
  data: UpdateProductOptionItemRequest
) {
  const formData = buildTranslationsFormData(data.translations);
  const response = await controlPrivateApi.post(
    `/product-options/${productOptionId}/items/update/${id}`,
    formData
  );
  return response.data;
}

async function deleteProductOptionItem(productOptionId: number, id: number) {
  const response = await controlPrivateApi.delete(
    `/product-options/${productOptionId}/items/delete/${id}`
  );
  return response.data;
}

async function toggleProductOptionItemStatus(productOptionId: number, id: number) {
  const response = await controlPrivateApi.post(
    `/product-options/${productOptionId}/items/change-active-status/${id}`
  );
  return response.data;
}

async function changeProductOptionItemSorting(productOptionId: number, id: number, sort: number) {
  const response = await controlPrivateApi.post(
    `/product-options/${productOptionId}/items/change-sorting/${id}`,
    { sort }
  );
  return response.data;
}

// Query options - Product Options
export const productOptionsQueryOptions = (filters: ProductOptionsFilters) =>
  queryOptions({
    queryKey: ["productOptions", filters],
    queryFn: () => getProductOptions(filters),
    staleTime: 5 * 60 * 1000,
  });

export const productOptionQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["productOption", id],
    queryFn: () => getProductOption(id),
    enabled: !!id,
  });

// Query options - Product Option Items
export const productOptionItemsQueryOptions = (
  productOptionId: number,
  filters: ProductOptionItemsFilters
) =>
  queryOptions({
    queryKey: ["productOptionItems", productOptionId, filters],
    queryFn: () => getProductOptionItems(productOptionId, filters),
    enabled: !!productOptionId,
    staleTime: 5 * 60 * 1000,
  });

export const productOptionItemQueryOptions = (productOptionId: number, id: number) =>
  queryOptions({
    queryKey: ["productOptionItem", productOptionId, id],
    queryFn: () => getProductOptionItem(productOptionId, id),
    enabled: !!(productOptionId && id),
  });

// Hooks - Product Options
export function useProductOptions(filters: ProductOptionsFilters) {
  return useQuery(productOptionsQueryOptions(filters));
}

export function useProductOption(id: number) {
  return useQuery(productOptionQueryOptions(id));
}

export function useCreateProductOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProductOption,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productOptions"] });
    },
  });
}

export function useUpdateProductOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductOptionRequest }) =>
      updateProductOption(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productOptions"] });
    },
  });
}

export function useDeleteProductOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProductOption,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productOptions"] });
    },
  });
}

export function useToggleProductOptionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => toggleProductOptionStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productOptions"] });
    },
  });
}

export function useChangeProductOptionSorting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sort }: { id: number; sort: number }) =>
      changeProductOptionSorting(id, sort),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productOptions"] });
    },
  });
}

// Hooks - Product Option Items
export function useProductOptionItems(productOptionId: number, filters: ProductOptionItemsFilters) {
  return useQuery(productOptionItemsQueryOptions(productOptionId, filters));
}

export function useProductOptionItem(productOptionId: number, id: number) {
  return useQuery(productOptionItemQueryOptions(productOptionId, id));
}

export function useCreateProductOptionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productOptionId,
      data,
    }: {
      productOptionId: number;
      data: CreateProductOptionItemRequest;
    }) => createProductOptionItem(productOptionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productOptionItems"] });
      queryClient.invalidateQueries({ queryKey: ["productOptions"] });
    },
  });
}

export function useUpdateProductOptionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productOptionId,
      id,
      data,
    }: {
      productOptionId: number;
      id: number;
      data: UpdateProductOptionItemRequest;
    }) => updateProductOptionItem(productOptionId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productOptionItems"] });
    },
  });
}

export function useDeleteProductOptionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productOptionId, id }: { productOptionId: number; id: number }) =>
      deleteProductOptionItem(productOptionId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productOptionItems"] });
      queryClient.invalidateQueries({ queryKey: ["productOptions"] });
    },
  });
}

export function useToggleProductOptionItemStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productOptionId, id }: { productOptionId: number; id: number }) =>
      toggleProductOptionItemStatus(productOptionId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productOptionItems"] });
    },
  });
}

export function useChangeProductOptionItemSorting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productOptionId,
      id,
      sort,
    }: {
      productOptionId: number;
      id: number;
      sort: number;
    }) => changeProductOptionItemSorting(productOptionId, id, sort),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productOptionItems"] });
    },
  });
}
