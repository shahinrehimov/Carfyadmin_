import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

export interface CatalogType {
  id: number;
  title: string;
  is_active: boolean;
  created_user: string;
  created_date: string;
}

interface CatalogTypeResponse {
  data: Array<CatalogType>;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

export interface CatalogTypeRequest {
  translations: Array<{
    language_id: number;
    title: string;
  }>;
}

interface CatalogFilters {
  page: number;
}

export interface CatalogTypeHooks {
  useItems: (filters: CatalogFilters) => ReturnType<typeof useQuery<CatalogTypeResponse>>;
  useItem: (id: number) => ReturnType<typeof useQuery<CatalogType>>;
  useCreate: () => ReturnType<typeof useMutation<any, any, CatalogTypeRequest>>;
  useUpdate: () => ReturnType<
    typeof useMutation<any, any, { id: number; data: CatalogTypeRequest }>
  >;
  useDelete: () => ReturnType<typeof useMutation<any, any, number>>;
  useToggleStatus: () => ReturnType<
    typeof useMutation<any, any, { id: number; isActive: boolean }>
  >;
}

export function createCatalogTypeHooks(apiPath: string, queryKey: string): CatalogTypeHooks {
  const getItems = async (filters: CatalogFilters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        params.append(key, String(value));
      }
    });
    const response = await controlPrivateApi.get(`/${apiPath}/load?${params}`);
    return response.data as CatalogTypeResponse;
  };

  const getItem = async (id: number) => {
    const response = await controlPrivateApi.get(`/${apiPath}/show/${id}`);
    return response.data.data as CatalogType;
  };

  const createItem = async (data: CatalogTypeRequest) => {
    const response = await controlPrivateApi.post(`/${apiPath}/add`, data);
    return response.data;
  };

  const updateItem = async ({ id, data }: { id: number; data: CatalogTypeRequest }) => {
    const response = await controlPrivateApi.post(`/${apiPath}/update/${id}`, data);
    return response.data;
  };

  const deleteItem = async (id: number) => {
    const response = await controlPrivateApi.delete(`/${apiPath}/delete/${id}`);
    return response.data;
  };

  const toggleStatus = async ({ id, isActive }: { id: number; isActive: boolean }) => {
    const response = await controlPrivateApi.post(`/${apiPath}/change-active-status/${id}`, {
      is_active: !isActive,
    });
    return response.data;
  };

  return {
    useItems(filters: CatalogFilters) {
      return useQuery(
        queryOptions({
          queryKey: [queryKey, filters],
          queryFn: () => getItems(filters),
          staleTime: 5 * 60 * 1000,
        })
      );
    },

    useItem(id: number) {
      return useQuery(
        queryOptions({
          queryKey: [`${queryKey}Single`, id],
          queryFn: () => getItem(id),
          enabled: !!id,
        })
      );
    },

    useCreate() {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: createItem,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
      });
    },

    useUpdate() {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: updateItem,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
      });
    },

    useDelete() {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: deleteItem,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
      });
    },

    useToggleStatus() {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: toggleStatus,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
      });
    },
  };
}
