import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// Types
export interface Group {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  sort: number;
  max_count: number;
  is_active: boolean;
  products_count: number;
  created_user: string;
  created_date: string;
}

export interface GroupProduct {
  id: number;
  group_id: number;
  product_id: number;
  product_variant_id: number;
  product_title: string;
  variant_title: string;
  sort: number;
}

interface GroupsResponse {
  data: Array<Group>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

interface GroupProductsResponse {
  data: Array<GroupProduct>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

interface CreateGroupRequest {
  translations: Array<{
    language_id: number;
    title: string;
  }>;
  slug?: string;
  sort: number;
  max_count: number;
  image?: File;
}

interface UpdateGroupRequest {
  translations: Array<{
    language_id: number;
    title: string;
  }>;
  slug?: string;
  sort: number;
  max_count: number;
  image?: File;
}

interface AddGroupProductRequest {
  group_id: number;
  product_variant_id: number;
  sort: number;
}

interface GroupsFilters {
  page: number;
  search?: string;
}

interface GroupProductsFilters {
  page: number;
  group_id: number;
}

export interface GroupProductListItem {
  id: number;
  title: string;
  main_image: string | null;
  is_set: boolean;
  brand: { id: number; title: string } | null;
  categories: { id: number; title: string }[];
  is_active: boolean;
  created_user: string;
  created_date: string;
}

interface GroupProductListFilters {
  page: number;
  group_id: number;
  search?: string;
}

interface GroupProductListResponse {
  data: Array<GroupProductListItem>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

// API functions - Groups
async function getGroups(filters: GroupsFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(`/groups/load?${queryParams}`);
  return response.data as GroupsResponse;
}

async function getGroup(id: number) {
  const response = await controlPrivateApi.get(`/groups/show/${id}`);
  return response.data.data as Group;
}

async function createGroup(data: CreateGroupRequest) {
  const formData = new FormData();

  data.translations.forEach((translation, index) => {
    formData.append(
      `translations[${index}][language_id]`,
      String(translation.language_id),
    );
    formData.append(`translations[${index}][title]`, translation.title);
  });

  if (data.slug) formData.append("slug", data.slug);
  formData.append("sort", String(data.sort));
  formData.append("max_count", String(data.max_count));
  if (data.image) formData.append("image", data.image);

  const response = await controlPrivateApi.post("/groups/add", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

async function updateGroup(id: number, data: UpdateGroupRequest) {
  const formData = new FormData();

  data.translations.forEach((translation, index) => {
    formData.append(
      `translations[${index}][language_id]`,
      String(translation.language_id),
    );
    formData.append(`translations[${index}][title]`, translation.title);
  });

  if (data.slug) formData.append("slug", data.slug);
  formData.append("sort", String(data.sort));
  formData.append("max_count", String(data.max_count));
  if (data.image) formData.append("image", data.image);

  const response = await controlPrivateApi.post(
    `/groups/update/${id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
}

async function deleteGroup(id: number) {
  const response = await controlPrivateApi.delete(`/groups/delete/${id}`);
  return response.data;
}

async function deleteGroupImage(id: number) {
  const response = await controlPrivateApi.delete(`/groups/delete-image/${id}`);
  return response.data;
}

async function toggleGroupStatus(id: number, isActive: boolean) {
  const response = await controlPrivateApi.post(
    `/groups/change-active-status/${id}`,
    {
      is_active: !isActive,
    },
  );
  return response.data;
}

async function changeGroupSorting(id: number, sort: number) {
  const response = await controlPrivateApi.post(
    `/groups/change-sorting/${id}`,
    {
      sort,
    },
  );
  return response.data;
}

// API functions - Group Product List (products/load with group_id)
async function getGroupProductList(filters: GroupProductListFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });
  const response = await controlPrivateApi.get(
    `/products/load?${queryParams}`,
  );
  return response.data as GroupProductListResponse;
}

async function removeGroupProduct(groupId: number, productId: number) {
  const response = await controlPrivateApi.post(
    `/groups/${groupId}/products/remove/${productId}`,
  );
  return response.data;
}

async function removeGroupProductsBulk(groupId: number, productIds: number[]) {
  const response = await controlPrivateApi.post(
    `/groups/${groupId}/products/remove-bulk`,
    { products: productIds },
  );
  return response.data;
}

// API functions - Group Products
async function getGroupProducts(filters: GroupProductsFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  const response = await controlPrivateApi.get(
    `/groups/products/load?${queryParams}`,
  );
  return response.data as GroupProductsResponse;
}

async function addGroupProduct(data: AddGroupProductRequest) {
  const response = await controlPrivateApi.post("/group-products/add", data);
  return response.data;
}

async function addGroupProductsBulk(
  groupId: number,
  productVariantIds: number[],
) {
  const response = await controlPrivateApi.post(
    `/groups/${groupId}/products/add-bulk`,
    { products: productVariantIds },
  );
  return response.data;
}

async function deleteGroupProduct(id: number) {
  const response = await controlPrivateApi.delete(
    `/group-products/delete/${id}`,
  );
  return response.data;
}

async function changeGroupProductSorting(id: number, sort: number) {
  const response = await controlPrivateApi.post(
    `/group-products/change-sorting/${id}`,
    {
      sort,
    },
  );
  return response.data;
}

// Query options - Groups
export const groupsQueryOptions = (filters: GroupsFilters) =>
  queryOptions({
    queryKey: ["groups", filters],
    queryFn: () => getGroups(filters),
    staleTime: 5 * 60 * 1000,
  });

export const groupQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["group", id],
    queryFn: () => getGroup(id),
    enabled: !!id,
  });

// Query options - Group Products
export const groupProductsQueryOptions = (filters: GroupProductsFilters) =>
  queryOptions({
    queryKey: ["groupProducts", filters],
    queryFn: () => getGroupProducts(filters),
    staleTime: 5 * 60 * 1000,
  });

// Hooks - Groups
export function useGroups(filters: GroupsFilters) {
  return useQuery(groupsQueryOptions(filters));
}

export function useGroup(id: number) {
  return useQuery(groupQueryOptions(id));
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateGroupRequest }) =>
      updateGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useDeleteGroupImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGroupImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useToggleGroupStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleGroupStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useChangeGroupSorting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, sort }: { id: number; sort: number }) =>
      changeGroupSorting(id, sort),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export const groupProductListQueryOptions = (
  filters: GroupProductListFilters,
) =>
  queryOptions({
    queryKey: ["groupProductList", filters],
    queryFn: () => getGroupProductList(filters),
    staleTime: 5 * 60 * 1000,
  });

// Hooks - Group Products
export function useGroupProducts(filters: GroupProductsFilters) {
  return useQuery(groupProductsQueryOptions(filters));
}

export function useGroupProductList(filters: GroupProductListFilters) {
  return useQuery(groupProductListQueryOptions(filters));
}

export function useRemoveGroupProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupId,
      productId,
    }: {
      groupId: number;
      productId: number;
    }) => removeGroupProduct(groupId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupProductList"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useRemoveGroupProductsBulk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupId,
      productIds,
    }: {
      groupId: number;
      productIds: number[];
    }) => removeGroupProductsBulk(groupId, productIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupProductList"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useAddGroupProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addGroupProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupProducts"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useAddGroupProductsBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      productVariantIds,
    }: {
      groupId: number;
      productVariantIds: number[];
    }) => addGroupProductsBulk(groupId, productVariantIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupProducts"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useDeleteGroupProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGroupProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupProducts"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useChangeGroupProductSorting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, sort }: { id: number; sort: number }) =>
      changeGroupProductSorting(id, sort),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupProducts"] });
    },
  });
}
