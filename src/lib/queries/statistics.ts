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
  /** null when the store row no longer exists */
  company: {
    id: number;
    uuid: string;
    name: string | null;
  } | null;
  quantity_sold: number;
  revenue: number;
  order_count: number;
}

// ─── Top products ─────────────────────────────────────────────────────────────

export interface TopProductsFilters extends StatisticsFilters {
  limit?: number;
}

export interface StatisticsCpv {
  id: number;
  uuid: string;
  title: string | null;
  main_image: string | null;
}

export interface TopSellingProduct {
  /** null when the listing row no longer exists */
  cpv: StatisticsCpv | null;
  quantity_sold: number;
  revenue: number;
  order_count: number;
}

export interface TopViewedProduct {
  cpv: StatisticsCpv | null;
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
  /** Fully cancelled orders + individually cancelled items */
  total_cancelled: number;
  cancelled_orders: number;
  cancelled_items: number;
  by_actor: { actor: string; count: number }[];
  top_reasons: { reason: string; count: number }[];
}

// ─── Commissions ──────────────────────────────────────────────────────────────

export interface CommissionsFilters extends StatisticsFilters {
  period?: OrderPeriod;
  limit?: number;
}

export interface CommissionChartPoint {
  date: string;
  commission: number;
  revenue: number;
}

export interface CommissionByCompany {
  company: {
    id: number;
    uuid: string;
    name: string | null;
  } | null;
  commission: number;
  revenue: number;
}

export interface CommissionsStatistics {
  summary: {
    total_commission: number;
    total_revenue: number;
    /** Commission as a share of revenue over the period */
    effective_rate: number;
    /** > 0 means old order items still need the backfill command */
    items_without_snapshot: number;
  };
  chart: CommissionChartPoint[];
  by_company: CommissionByCompany[];
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildParams(filters: object) {
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
  return res.data as OrdersStatistics;
}

async function getTopStores(filters: TopStoresFilters) {
  const res = await controlPrivateApi.get(
    `/statistics/top-stores?${buildParams(filters)}`,
  );
  return res.data.data as TopStoreItem[];
}

async function getTopProducts(filters: TopProductsFilters) {
  const res = await controlPrivateApi.get(
    `/statistics/top-products?${buildParams(filters)}`,
  );
  return res.data as TopProductsStatistics;
}

async function getUsersStatistics(filters: UsersStatisticsFilters) {
  const res = await controlPrivateApi.get(
    `/statistics/users?${buildParams(filters)}`,
  );
  return res.data as UsersStatistics;
}

async function getCancellationsStatistics(filters: CancellationsFilters) {
  const res = await controlPrivateApi.get(
    `/statistics/cancellations?${buildParams(filters)}`,
  );
  return res.data as CancellationsStatistics;
}

async function getCommissionsStatistics(filters: CommissionsFilters) {
  const res = await controlPrivateApi.get(
    `/statistics/commissions?${buildParams(filters)}`,
  );
  return res.data as CommissionsStatistics;
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

export const commissionsStatisticsQueryOptions = (
  filters: CommissionsFilters,
) =>
  queryOptions({
    queryKey: ["statistics", "commissions", filters],
    queryFn: () => getCommissionsStatistics(filters),
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

export function useCommissionsStatistics(filters: CommissionsFilters) {
  return useQuery(commissionsStatisticsQueryOptions(filters));
}
