import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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
  /** @deprecated null when the product spans several brands; use brands */
  brand: ProductBrand | null;
  brands: ProductBrand[];
  is_universal: boolean;
  main_category: ProductCategory;
  categories: ProductCategory[];
  groups: unknown[];
  company: { id: number; uuid: string; title: string } | null;
  variants_count: number;
  pending_variants_count: number;
  pending_revisions_count: number;
  pending_product_revisions_count: number;
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
  /** @deprecated null when the product spans several brands; use brands */
  brand: ProductBrand | null;
  brands: ProductBrand[];
  is_universal: boolean;
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

/**
 * One "fits this car" rule. null means "all": no brand fits every car, a brand
 * without a model fits all of its models, and an open year bound is
 * unrestricted on that side.
 */
export interface Fitment {
  brand: { id: number; title: string } | null;
  brand_model: { id: number; title: string } | null;
  year_from: number | null;
  year_to: number | null;
}

export interface ProductVariant {
  id: number;
  uuid: string;
  slug: string;
  title: string;
  main_image: string | null;
  hover_image: string | null;
  product: Pick<
    Product,
    | "id"
    | "uuid"
    | "slug"
    | "title"
    | "main_image"
    | "hover_image"
    | "is_set"
    | "brand"
    | "main_category"
    | "categories"
    | "is_active"
    | "created_user"
    | "created_date"
  >;
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
  /** @deprecated derived from fitments; prefer fitments */
  brand_models: VariantBrandModel[];
  fitments: Fitment[];
  is_universal: boolean;
  requires_fitment_selection?: boolean;
  /** @deprecated use year_from / year_to */
  year: number | null;
  year_from: number | null;
  year_to: number | null;
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
  /** @deprecated derived from fitments; prefer fitments */
  brand_models: VariantBrandModel[];
  fitments: Fitment[];
  is_universal: boolean;
  requires_fitment_selection?: boolean;
  /** @deprecated use year_from / year_to */
  year: number | null;
  year_from: number | null;
  year_to: number | null;
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
    /** @deprecated null when the product spans several brands; use brands */
    brand: ProductBrand | null;
    brands: ProductBrand[];
    is_universal: boolean;
  };
  approval_status: "pending" | "approved" | "rejected";
  approval_status_label: string;
  approval_status_message: string | null;
  size_category: { value: string } | string | null;
  weight_gram: number | null;
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
    /** @deprecated derived from fitments */
    brand_models: Array<{ id: number; title: string }>;
    fitments: Fitment[];
    is_universal: boolean;
    requires_fitment_selection?: boolean;
    /** @deprecated use year_from / year_to */
    year: number | null;
    year_from: number | null;
    year_to: number | null;
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
  commission_percent: number;
  site_price: number;
  site_price_final: number;
  discount: number;
  discount_type: string | null;
  discount_type_title: string | null;
  city: { id: number; title: string } | null;
  is_active: boolean;
  approval_status: "pending" | "approved" | "rejected";
  approval_status_label: string;
  approval_status_message: string | null;
  seller_images: Array<{ id: number; url: string }>;
  company: { id: number; uuid: string; title: string } | null;
  created_date: string;
}

export function getCpvImage(cpv: AdminCPV): string | null {
  return (
    cpv.variant?.main_image ??
    cpv.seller_images?.[0]?.url ??
    cpv.variant?.product?.main_image ??
    null
  );
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
    // Resolved to titles server-side; used to be bare ids.
    fitments: Fitment[];
    requires_fitment_selection?: boolean | null;
    options: { option_id: number; value: any }[];
  };
  current: {
    oem_code: string | null;
    fitments: Fitment[];
    is_universal: boolean;
    requires_fitment_selection?: boolean;
    options: { option_id: number; value: any }[];
  };
  images: {
    main_image: string | null;
    hover_image: string | null;
    images: { id: number; url: string }[];
  };
  created_date: string;
}

export interface ProductRevision {
  id: number;
  status: "pending" | "approved" | "rejected";
  rejection_message: string | null;
  company: { id: number; title: string } | null;
  data: {
    main_category_id: number | null;
    categories: number[];
    sets: { product_variant_id: number; quantity: number }[];
    translations: {
      language_id: number;
      title: string;
      description_short: string;
      description?: string;
      delivery?: string;
      note?: string;
    }[];
  };
  current: {
    main_category_id: number | null;
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

async function toggleProductStatus(id: number, isActive: boolean) {
  const response = await controlPrivateApi.post(
    `/products/change-active-status/${id}`,
    {
      is_active: !isActive,
    },
  );
  return response.data;
}

async function deleteProduct(id: number) {
  const response = await controlPrivateApi.delete(`/products/delete/${id}`);
  return response.data;
}

// ─── API Functions – Variants ─────────────────────────────────────────────────

async function getProductVariants(filters: VariantsFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== "") params.append(k, String(v));
  });
  const response = await controlPrivateApi.get(
    `/product-variants/load?${params}`,
  );
  return response.data as PaginatedResponse<ProductVariant>;
}

async function getProductVariant(id: number) {
  const response = await controlPrivateApi.get(`/product-variants/show/${id}`);
  return response.data.data as ProductVariantDetail;
}

async function toggleVariantStatus(id: number, isActive: boolean) {
  const response = await controlPrivateApi.post(
    `/product-variants/change-active-status/${id}`,
    {
      is_active: !isActive,
    },
  );
  return response.data;
}

async function deleteProductVariant(id: number) {
  const response = await controlPrivateApi.delete(
    `/product-variants/delete/${id}`,
  );
  return response.data;
}

async function getVariantRevisions(variantId: number) {
  const response = await controlPrivateApi.get(
    `/product-variants/${variantId}/revisions`,
  );
  return response.data.data as VariantRevision[];
}

async function approveRevision(revisionId: number) {
  const response = await controlPrivateApi.post(
    `/product-variants/revisions/${revisionId}/approve`,
  );
  return response.data;
}

async function rejectRevision(revisionId: number, message?: string) {
  const response = await controlPrivateApi.post(
    `/product-variants/revisions/${revisionId}/reject`,
    {
      message: message || null,
    },
  );
  return response.data;
}

// ─── API Functions – Product Revisions ───────────────────────────────────────

async function getProductRevisions(productId: number) {
  const response = await controlPrivateApi.get(
    `/products/${productId}/revisions`,
  );
  return response.data.data as ProductRevision[];
}

async function approveProductRevision(revisionId: number) {
  const response = await controlPrivateApi.post(
    `/products/revisions/${revisionId}/approve`,
  );
  return response.data;
}

async function rejectProductRevision(revisionId: number, message?: string) {
  const response = await controlPrivateApi.post(
    `/products/revisions/${revisionId}/reject`,
    {
      message: message || null,
    },
  );
  return response.data;
}

// ─── API Functions – Company Product Variants (Admin) ─────────────────────────

async function getAdminCPVs(filters: CPVFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== "") params.append(k, String(v));
  });
  const response = await controlPrivateApi.get(
    `/company-product-variants/load?${params}`,
  );
  return response.data as PaginatedResponse<AdminCPV>;
}

async function getAdminCPVHistory(cpvId: number) {
  const response = await controlPrivateApi.get(
    `/company-product-variants/${cpvId}/approval-status/history`,
  );
  return response.data as PaginatedResponse<ApprovalHistoryItem>;
}

async function approveCPV(id: number) {
  const response = await controlPrivateApi.post(
    `/company-product-variants/${id}/approval-status/approve`,
  );
  return response.data;
}

async function rejectCPV(id: number, message?: string) {
  const response = await controlPrivateApi.post(
    `/company-product-variants/${id}/approval-status/reject`,
    {
      approval_status_message: message || null,
    },
  );
  return response.data;
}

async function toggleCPVStatus(id: number, isActive: boolean) {
  const response = await controlPrivateApi.post(
    `/company-product-variants/change-active-status/${id}`,
    {
      is_active: !isActive,
    },
  );
  return response.data;
}

async function deleteCPV(id: number) {
  const response = await controlPrivateApi.delete(
    `/company-product-variants/delete/${id}`,
  );
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
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleProductStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
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
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleVariantStatus(id, isActive),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["productVariants"] });
      queryClient.invalidateQueries({ queryKey: ["productVariant", id] });
      queryClient.invalidateQueries({ queryKey: ["adminCPVs"] });
    },
  });
}

export function useDeleteProductVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteProductVariant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productVariants"] });
      queryClient.invalidateQueries({ queryKey: ["adminCPVs"] });
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

// ─── Hooks – Product Revisions ────────────────────────────────────────────────

export function useProductRevisions(productId: number, enabled = false) {
  return useQuery({
    queryKey: ["productRevisions", productId],
    queryFn: () => getProductRevisions(productId),
    enabled,
  });
}

export function useApproveProductRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => approveProductRevision(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productRevisions"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}

export function useRejectProductRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: number; message?: string }) =>
      rejectProductRevision(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productRevisions"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
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

export function useToggleCPVStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleCPVStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCPVs"] });
    },
  });
}

export function useDeleteCPV() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCPV(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCPVs"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
