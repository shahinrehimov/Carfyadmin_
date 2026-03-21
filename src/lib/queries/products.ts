import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// ─── Product Types ────────────────────────────────────────────────────────────

export interface ProductBrand {
  id: number;
  uuid: string;
  slug: string;
  title: string;
}

export interface ProductCategory {
  id: number;
  uuid: string;
  slug: string;
  title: string;
  parent?: {
    id: number;
    uuid: string;
    slug: string;
    title: string;
  } | null;
}

export interface Product {
  id: number;
  uuid: string;
  slug: string;
  title: string;
  main_image: string | null;
  hover_image: string | null;
  is_set: boolean;
  brand: ProductBrand;
  main_category: ProductCategory;
  categories: ProductCategory[];
  groups: unknown[];
  variants_count: number;
  pending_variants_count: number;
  pending_revisions_count: number;
  is_active: boolean;
  created_user: string;
  created_date: string;
}

export interface ProductTranslation {
  language_id: number;
  title: string;
  description_short: string;
  description: string;
  delivery: string;
  note: string;
}

export interface ProductDetail {
  id: number;
  uuid: string;
  slug: string;
  main_image: string | null;
  hover_image: string | null;
  images: {
    urls: string[];
    media_ids: number[];
  };
  is_set: boolean;
  brand_id: number;
  brand: ProductBrand;
  main_category: ProductCategory;
  categories: ProductCategory[];
  variants_count: number;
  translations: ProductTranslation[];
  is_active: boolean;
}

// ─── Variant Types ────────────────────────────────────────────────────────────

export interface VariantCity {
  id: number;
  title: string;
}

export interface VariantBrandModel {
  id: number;
  title: string;
}

export interface ProductVariant {
  id: number;
  uuid: string;
  slug: string;
  title: string;
  main_image: string | null;
  hover_image: string | null;
  product: Pick<Product, "id" | "uuid" | "slug" | "title" | "main_image" | "hover_image" | "is_set" | "brand" | "main_category" | "categories" | "is_active" | "created_user" | "created_date">;
  is_set: boolean;
  sets_count: number;
  groups: unknown[];
  stock: number;
  price: number;
  price_final: number;
  discount_type: string | null;
  discount_type_title: string | null;
  discount: number;
  city: VariantCity | null;
  brand_model: VariantBrandModel | null;
  year: number;
  is_default: boolean;
  is_active: boolean;
  approval_status: "pending" | "approved" | "rejected";
  approval_status_label: string;
  approval_status_message: string | null;
  created_user: string;
  created_date: string;
}

export interface VariantOptionItem {
  id: number;
  uuid: string;
  title: string;
}

export interface VariantOption {
  id: number;
  option_id: number;
  value: string | number;
  translations: unknown[];
  option: {
    id: number;
    uuid: string;
    name: string;
    title: string;
    is_required: boolean;
    has_items: boolean;
    is_translatable: boolean;
    can_multiple: boolean;
    items: VariantOptionItem[];
  };
}

export interface ProductVariantDetail {
  id: number;
  uuid: string;
  slug: string;
  main_image: string | null;
  hover_image: string | null;
  images: {
    urls: string[];
    media_ids: number[];
  };
  is_set: boolean;
  sets: unknown[];
  groups: unknown[];
  options: VariantOption[];
  stock: number;
  price: number;
  price_final: number;
  discount_type: string | null;
  discount: number;
  discount_start_at: string | null;
  discount_end_at: string | null;
  city: VariantCity | null;
  brand_model: VariantBrandModel | null;
  year: number;
  translations: unknown[] | null;
  is_default: boolean;
  is_active: boolean;
  product: {
    id: number;
    uuid: string;
    slug: string;
    title: string;
    main_image: string | null;
    hover_image: string | null;
    images: string[];
    is_set: boolean;
    brand: ProductBrand;
  };
  approval_status: "pending" | "approved" | "rejected";
  approval_status_label: string;
  approval_status_message: string | null;
}

// ─── Company Product Variant Types ───────────────────────────────────────────

export interface AdminCPV {
  id: number;
  uuid: string;
  variant: {
    id: number;
    uuid: string;
    slug: string;
    title: string;
    oem_code: string | null;
    main_image: string | null;
    is_set: boolean;
    is_creator: boolean;
    has_pending_revision: boolean;
    brand_model: { id: number; title: string } | null;
    year: number | null;
    product: {
      id: number;
      uuid: string;
      slug: string;
      title: string;
      main_image: string | null;
      is_active: boolean;
    } | null;
  } | null;
  stock: number;
  price: number;
  price_final: number;
  discount: number;
  discount_type: string | null;
  discount_type_title: string | null;
  city: { id: number; title: string } | null;
  is_active: boolean;
  approval_status: "pending" | "approved" | "rejected";
  approval_status_label: string;
  approval_status_message: string | null;
  company: { id: number; uuid: string; title: string } | null;
  created_date: string;
}

export interface ApprovalHistoryItem {
  id: number;
  approval_status: string;
  approval_status_label: string;
  approval_status_message: string | null;
  created_user: string;
  created_date: string;
}

export interface VariantRevision {
  id: number;
  status: "pending" | "approved" | "rejected";
  rejection_message: string | null;
  company: { id: number; title: string } | null;
  data: {
    oem_code: string | null;
    brand_model_id: number | null;
    year: number | null;
    options: { option_id: number; value: any }[];
  };
  current: {
    oem_code: string | null;
    brand_model_id: number | null;
    brand_model: { id: number; title: string } | null;
    year: number | null;
    options: { option_id: number; value: any }[];
  };
  images: {
    main_image: string | null;
    hover_image: string | null;
    images: { id: number; url: string }[];
  };
  created_date: string;
}

// ─── Response Types ───────────────────────────────────────────────────────────

interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

// ─── Filters ──────────────────────────────────────────────────────────────────

interface ProductsFilters {
  page: number;
  search?: string;
}

interface VariantsFilters {
  page: number;
  product_id: number;
}

interface CPVFilters {
  page: number;
  product_id?: number;
  company_id?: number;
  approval_status?: string;
  search?: string;
}

// ─── API Functions – Products ─────────────────────────────────────────────────

async function getProducts(filters: ProductsFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== "") params.append(k, String(v));
  });
  const response = await controlPrivateApi.get(`/products/load?${params}`);
  return response.data as PaginatedResponse<Product>;
}

async function getProduct(id: number) {
  const response = await controlPrivateApi.get(`/products/show/${id}`);
  return response.data.data as ProductDetail;
}

async function toggleProductStatus(id: number) {
  const response = await controlPrivateApi.post(`/products/change-active-status/${id}`);
  return response.data;
}

// ─── API Functions – Variants ─────────────────────────────────────────────────

async function getProductVariants(filters: VariantsFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== "") params.append(k, String(v));
  });
  const response = await controlPrivateApi.get(`/product-variants/load?${params}`);
  return response.data as PaginatedResponse<ProductVariant>;
}

async function getProductVariant(id: number) {
  const response = await controlPrivateApi.get(`/product-variants/show/${id}`);
  return response.data.data as ProductVariantDetail;
}

async function toggleVariantStatus(id: number) {
  const response = await controlPrivateApi.post(`/product-variants/change-active-status/${id}`);
  return response.data;
}

async function getVariantApprovalHistory(variantId: number) {
  const response = await controlPrivateApi.get(`/product-variants/${variantId}/approval-status/history`);
  return response.data as PaginatedResponse<ApprovalHistoryItem>;
}

async function approveVariant(id: number) {
  const response = await controlPrivateApi.post(`/product-variants/${id}/approval-status/approve`);
  return response.data;
}

async function rejectVariant(id: number, message?: string) {
  const response = await controlPrivateApi.post(`/product-variants/${id}/approval-status/reject`, {
    message: message || null,
  });
  return response.data;
}

async function getVariantRevisions(variantId: number) {
  const response = await controlPrivateApi.get(`/product-variants/${variantId}/revisions`);
  return response.data.data as VariantRevision[];
}

async function approveRevision(revisionId: number) {
  const response = await controlPrivateApi.post(`/product-variants/revisions/${revisionId}/approve`);
  return response.data;
}

async function rejectRevision(revisionId: number, message?: string) {
  const response = await controlPrivateApi.post(`/product-variants/revisions/${revisionId}/reject`, {
    message: message || null,
  });
  return response.data;
}

// ─── API Functions – Company Product Variants (Admin) ─────────────────────────

async function getAdminCPVs(filters: CPVFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== "") params.append(k, String(v));
  });
  const response = await controlPrivateApi.get(`/company-product-variants/load?${params}`);
  return response.data as PaginatedResponse<AdminCPV>;
}

async function getAdminCPVHistory(cpvId: number) {
  const response = await controlPrivateApi.get(`/company-product-variants/${cpvId}/approval-status/history`);
  return response.data as PaginatedResponse<ApprovalHistoryItem>;
}

async function approveCPV(id: number) {
  const response = await controlPrivateApi.post(`/company-product-variants/${id}/approval-status/approve`);
  return response.data;
}

async function rejectCPV(id: number, message?: string) {
  const response = await controlPrivateApi.post(`/company-product-variants/${id}/approval-status/reject`, {
    message: message || null,
  });
  return response.data;
}

// ─── Query Options ────────────────────────────────────────────────────────────

export const productsQueryOptions = (filters: ProductsFilters) =>
  queryOptions({
    queryKey: ["products", filters],
    queryFn: () => getProducts(filters),
    staleTime: 5 * 60 * 1000,
  });

export const productQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["product", id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  });

export const productVariantsQueryOptions = (filters: VariantsFilters) =>
  queryOptions({
    queryKey: ["productVariants", filters],
    queryFn: () => getProductVariants(filters),
    staleTime: 2 * 60 * 1000,
  });

export const productVariantQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["productVariant", id],
    queryFn: () => getProductVariant(id),
    enabled: !!id,
  });

export const variantApprovalHistoryQueryOptions = (variantId: number, enabled = false) =>
  queryOptions({
    queryKey: ["variantApprovalHistory", variantId],
    queryFn: () => getVariantApprovalHistory(variantId),
    enabled,
  });

export const adminCPVsQueryOptions = (filters: CPVFilters) =>
  queryOptions({
    queryKey: ["adminCPVs", filters],
    queryFn: () => getAdminCPVs(filters),
    staleTime: 2 * 60 * 1000,
  });

export const adminCPVHistoryQueryOptions = (cpvId: number, enabled = false) =>
  queryOptions({
    queryKey: ["adminCPVHistory", cpvId],
    queryFn: () => getAdminCPVHistory(cpvId),
    enabled,
  });

// ─── Hooks – Products ─────────────────────────────────────────────────────────

export function useProducts(filters: ProductsFilters) {
  return useQuery(productsQueryOptions(filters));
}

export function useProduct(id: number) {
  return useQuery(productQueryOptions(id));
}

export function useToggleProductStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => toggleProductStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// ─── Hooks – Variants ─────────────────────────────────────────────────────────

export function useProductVariants(filters: VariantsFilters) {
  return useQuery(productVariantsQueryOptions(filters));
}

export function useProductVariant(id: number) {
  return useQuery(productVariantQueryOptions(id));
}

export function useToggleVariantStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => toggleVariantStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productVariants"] });
    },
  });
}

export function useVariantApprovalHistory(variantId: number, enabled = false) {
  return useQuery(variantApprovalHistoryQueryOptions(variantId, enabled));
}

export function useApproveVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => approveVariant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productVariants"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useRejectVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: number; message?: string }) =>
      rejectVariant(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productVariants"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useVariantRevisions(variantId: number, enabled = false) {
  return useQuery({
    queryKey: ["variantRevisions", variantId],
    queryFn: () => getVariantRevisions(variantId),
    enabled,
  });
}

export function useApproveRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => approveRevision(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variantRevisions"] });
      queryClient.invalidateQueries({ queryKey: ["adminCPVs"] });
    },
  });
}

export function useRejectRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: number; message?: string }) =>
      rejectRevision(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variantRevisions"] });
    },
  });
}

// ─── Hooks – Company Product Variants (Admin) ─────────────────────────────────

export function useAdminCPVs(filters: CPVFilters) {
  return useQuery(adminCPVsQueryOptions(filters));
}

export function useAdminCPVHistory(cpvId: number, enabled = false) {
  return useQuery(adminCPVHistoryQueryOptions(cpvId, enabled));
}

export function useApproveCPV() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => approveCPV(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCPVs"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useRejectCPV() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: number; message?: string }) =>
      rejectCPV(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCPVs"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
