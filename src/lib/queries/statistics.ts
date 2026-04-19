import { queryOptions, useQuery } from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// ─── Shared filter types ──────────────────────────────────────────────────────

export interface StatisticsFilters {
  date_from?: string;
  date_to?: string;
  company_id?: number;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export type OrderPeriod = "daily" | "weekly" | "monthly";

export interface OrdersStatisticsFilters extends StatisticsFilters {
  period?: OrderPeriod;
  status?: string;
}

export interface OrderChartPoint {
  date: string;
  order_count: number;
  revenue: number;
  quantity: number;
}

export interface OrdersStatistics {
  summary: {
    total_orders: number;
    total_revenue: number;
    total_quantity: number;
  };
  chart: OrderChartPoint[];
}

// ─── Top stores ───────────────────────────────────────────────────────────────

export interface TopStoresFilters extends StatisticsFilters {
  limit?: number;
}

export interface TopStoreItem {
  company: {
    id: number;
    uuid: string;
    name: string;
  };
  quantity_sold: number;
  revenue: number;
  order_count: number;
}

// ─── Top products ─────────────────────────────────────────────────────────────

export interface TopProductsFilters extends StatisticsFilters {
  limit?: number;
}

export interface TopSellingProduct {
  cpv: {
    id: number;
    uuid: string;
    title: string;
    main_image: string | null;
  };
  quantity_sold: number;
  revenue: number;
  order_count: number;
}

export interface TopViewedProduct {
  cpv: {
    id: number;
    uuid: string;
    title: string;
    main_image: string | null;
  };
  view_count: number;
}

export interface TopProductsStatistics {
  top_selling: TopSellingProduct[];
  top_viewed: TopViewedProduct[];
}

// ─── Users ────────────────────────────────────────────────────────────────────

export interface UsersStatisticsFilters extends StatisticsFilters {
  period?: OrderPeriod;
}

export interface UserChartPoint {
  date: string;
  count: number;
}

export interface UsersStatistics {
  summary: {
    registered: number;
    active_via_login: number;
    active_via_order: number;
  };
  registration_chart: UserChartPoint[];
}

// ─── Cancellations ────────────────────────────────────────────────────────────

export interface CancellationsFilters extends StatisticsFilters {
  limit?: number;
}

export interface CancellationsStatistics {
  total_cancelled: number;
  by_actor: { actor: string; count: number }[];
  top_reasons: { reason: string; count: number }[];
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildParams(filters: Record<string, unknown>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      params.append(key, String(value));
    }
  });
  return params.toString();
}

// ─── API functions ────────────────────────────────────────────────────────────

async function getOrdersStatistics(filters: OrdersStatisticsFilters) {
  const res = await controlPrivateApi.get(
    `/statistics/orders?${buildParams(filters)}`,
  );
  return res.data.data as OrdersStatistics;
}

async function getTopStores(filters: TopStoresFilters) {
  const res = await controlPrivateApi.get(
    `/statistics/top-stores?${buildParams(filters)}`,
  );
  return res.data.data.data as TopStoreItem[];
}

async function getTopProducts(filters: TopProductsFilters) {
  const res = await controlPrivateApi.get(
    `/statistics/top-products?${buildParams(filters)}`,
  );
  return res.data.data as TopProductsStatistics;
}

async function getUsersStatistics(filters: UsersStatisticsFilters) {
  const res = await controlPrivateApi.get(
    `/statistics/users?${buildParams(filters)}`,
  );
  return res.data.data as UsersStatistics;
}

async function getCancellationsStatistics(filters: CancellationsFilters) {
  const res = await controlPrivateApi.get(
    `/statistics/cancellations?${buildParams(filters)}`,
  );
  return res.data.data as CancellationsStatistics;
}

// ─── Query options ────────────────────────────────────────────────────────────

export const ordersStatisticsQueryOptions = (
  filters: OrdersStatisticsFilters,
) =>
  queryOptions({
    queryKey: ["statistics", "orders", filters],
    queryFn: () => getOrdersStatistics(filters),
    staleTime: 2 * 60 * 1000,
  });

export const topStoresQueryOptions = (filters: TopStoresFilters) =>
  queryOptions({
    queryKey: ["statistics", "top-stores", filters],
    queryFn: () => getTopStores(filters),
    staleTime: 2 * 60 * 1000,
  });

export const topProductsQueryOptions = (filters: TopProductsFilters) =>
  queryOptions({
    queryKey: ["statistics", "top-products", filters],
    queryFn: () => getTopProducts(filters),
    staleTime: 2 * 60 * 1000,
  });

export const usersStatisticsQueryOptions = (
  filters: UsersStatisticsFilters,
) =>
  queryOptions({
    queryKey: ["statistics", "users", filters],
    queryFn: () => getUsersStatistics(filters),
    staleTime: 2 * 60 * 1000,
  });

export const cancellationsStatisticsQueryOptions = (
  filters: CancellationsFilters,
) =>
  queryOptions({
    queryKey: ["statistics", "cancellations", filters],
    queryFn: () => getCancellationsStatistics(filters),
    staleTime: 2 * 60 * 1000,
  });

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useOrdersStatistics(filters: OrdersStatisticsFilters) {
  return useQuery(ordersStatisticsQueryOptions(filters));
}

export function useTopStores(filters: TopStoresFilters) {
  return useQuery(topStoresQueryOptions(filters));
}

export function useTopProducts(filters: TopProductsFilters) {
  return useQuery(topProductsQueryOptions(filters));
}

export function useUsersStatistics(filters: UsersStatisticsFilters) {
  return useQuery(usersStatisticsQueryOptions(filters));
}

export function useCancellationsStatistics(filters: CancellationsFilters) {
  return useQuery(cancellationsStatisticsQueryOptions(filters));
}
