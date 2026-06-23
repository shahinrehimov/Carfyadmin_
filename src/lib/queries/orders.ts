import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OrderAddress {
  address_type: { id: number; title: string } | null;
  city: { id: number; title: string; country_id: number } | null;
  address_line_1: string;
  address_line_2: string | null;
  latitude: string;
  longitude: string;
  phone: string;
}

export interface OrderUser {
  id: number;
  uuid: string;
  full_name: string;
  email: string;
  phone: string;
}

export interface Order {
  id: number;
  code: string;
  uuid: string;
  items_count: number;
  products_count: number;
  status: string;
  status_label: string;
  payment_status: string;
  payment_status_label: string;
  transaction_id: string | null;
  paid_at: string | null;
  refund_at: string | null;
  amount: number;
  amount_final: number;
  total_discount_in_basket: number;
  shipping: number;
  user: OrderUser | null;
  address: OrderAddress;
  created_at: string;
}

export interface OrderItem {
  quantity: number;
  amount: number;
  amount_final: number;
  product: {
    uuid: string;
    variant_slug: string;
    title: string;
    oem_code: string | null;
    hover_image: string | null;
    is_set: boolean;
    stock: number;
    price: number;
    price_final: number;
    seller: { uuid: string; store_code: string; label: string };
    product: {
      id: number;
      uuid: string;
      slug: string;
      title: string;
    };
  };
}

export interface OrderItemBySeller {
  id: number;
  status: string;
  cancel_reason: string | null;
  quantity: number;
  amount: number;
  amount_final: number;
  product_title: string;
  status_history: Array<{
    status: string;
    created_at: string;
    created_user?: string;
  }>;
}

export interface SellerGroup {
  company_id: number;
  company_name: string | null;
  store_code: string;
  items: OrderItemBySeller[];
}

export interface WoltDelivery {
  wolt_order_reference_id: string;
  tracking_url: string;
  status: string;
  part: number;
}

export interface ShippingPerSeller {
  company_id: number;
  company_name: string | null;
  store_code: string;
  amount: number;
  refunded_at: string | null;
  wolt_status: string | null;
  wolt_deliveries: WoltDelivery[] | null;
}

export interface OrderCompany {
  id: number;
  title: string | null;
  store_code: string;
  wolt_status: string | null;
  has_active_items: boolean;
}

export interface StatusTreeItem {
  status: string;
  status_label: string;
  is_checked: boolean;
  date: string | null;
}

export interface StatusHistoryItem {
  id: number;
  status: string;
  status_label: string;
  created_at: string;
  created_user: string;
}

export interface PaymentLog {
  id: number;
  action: string;
  payment_method: string;
  transaction_id: string | null;
  status: string;
  order_status: string;
  request: unknown | null;
  response: unknown | null;
  created_at: string;
}

export interface OrderDetail extends Order {
  payment_method: string;
  payment_method_display: string;
  courier_info: {
    name: string;
    phone: string;
    eta: string;
    notes: string;
  } | null;
  cancel_reason: string | null;
  status_tree: StatusTreeItem[];
  statuses: StatusHistoryItem[];
  items_by_seller: SellerGroup[];
  items: OrderItem[];
  shipping_per_seller: ShippingPerSeller[];
  companies: OrderCompany[];
  payment_logs: PaymentLog[];
}

interface OrdersResponse {
  data: Order[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

export interface OrdersFilters {
  page: number;
  search?: string;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  amount_min?: string;
  amount_max?: string;
  user?: string;
  date_from?: string;
  date_to?: string;
  code?: string;
}

interface ChangeStatusRequest {
  status: string;
  cancel_reason?: string | null;
}

interface UpdatePaymentStatusRequest {
  status: string;
}

interface RefundRequest {
  status: string;
}

interface SetFinalStatusRequest {
  status: string;
  cancel_reason?: string | null;
}

interface AssignCourierRequest {
  courier_info: {
    name: string;
    phone: string;
    eta: string;
    notes: string;
  };
}

interface RequestWoltDeliveryRequest {
  company_id: number;
}

// ─── API functions ────────────────────────────────────────────────────────────

async function getOrders(filters: OrdersFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });
  const response = await controlPrivateApi.get(`/orders/load?${queryParams}`);
  return response.data as OrdersResponse;
}

async function getOrder(id: number) {
  const response = await controlPrivateApi.get(`/orders/show/${id}`);
  return response.data.data as OrderDetail;
}

async function getSearchFilters() {
  const response = await controlPrivateApi.get("/orders/search-filters");
  return response.data;
}

async function changeOrderStatus(id: number, data: ChangeStatusRequest) {
  const response = await controlPrivateApi.post(`/orders/change-status/${id}`, data);
  return response.data;
}

async function updatePaymentStatus(id: number, data: UpdatePaymentStatusRequest) {
  const response = await controlPrivateApi.post(`/orders/update-payment-status/${id}`, data);
  return response.data;
}

async function refundOrder(id: number, data: RefundRequest) {
  const response = await controlPrivateApi.post(`/orders/refund/${id}`, data);
  return response.data;
}

async function setFinalStatus(id: number, data: SetFinalStatusRequest) {
  const response = await controlPrivateApi.post(`/orders/set-final-status/${id}`, data);
  return response.data;
}

async function assignCourier(id: number, data: AssignCourierRequest) {
  const response = await controlPrivateApi.post(`/orders/assign-courier/${id}`, data);
  return response.data;
}

async function requestWoltDelivery(id: number, data: RequestWoltDeliveryRequest) {
  const response = await controlPrivateApi.post(`/orders/request-wolt-delivery/${id}`, data);
  return response.data;
}

// ─── Query options ────────────────────────────────────────────────────────────

export const ordersQueryOptions = (filters: OrdersFilters) =>
  queryOptions({
    queryKey: ["orders", filters],
    queryFn: () => getOrders(filters),
    staleTime: 2 * 60 * 1000,
  });

export const orderQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["order", id],
    queryFn: () => getOrder(id),
    enabled: !!id,
  });

export const ordersSearchFiltersQueryOptions = () =>
  queryOptions({
    queryKey: ["orders-search-filters"],
    queryFn: getSearchFilters,
    staleTime: 10 * 60 * 1000,
  });

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useOrders(filters: OrdersFilters) {
  return useQuery(ordersQueryOptions(filters));
}

export function useOrder(id: number) {
  return useQuery(orderQueryOptions(id));
}

export function useOrdersSearchFilters() {
  return useQuery(ordersSearchFiltersQueryOptions());
}

export function useChangeOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ChangeStatusRequest }) =>
      changeOrderStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
    },
  });
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePaymentStatusRequest }) =>
      updatePaymentStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
    },
  });
}

export function useRefundOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RefundRequest }) =>
      refundOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
    },
  });
}

export function useSetFinalStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SetFinalStatusRequest }) =>
      setFinalStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
    },
  });
}

export function useAssignCourier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssignCourierRequest }) =>
      assignCourier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
    },
  });
}

export function useRequestWoltDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RequestWoltDeliveryRequest }) =>
      requestWoltDelivery(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
    },
  });
}
