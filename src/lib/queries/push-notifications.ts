import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { controlPrivateApi } from "../axios/controlPrivateApi";
import type {
  PushNotification,
  PushNotificationDetail,
  PushNotificationsResponse,
  PushNotificationsFilters,
  CreatePushNotificationRequest,
  UpdatePushNotificationRequest,
  NotificationSetting,
  NotificationSettingsResponse,
} from "../types/push-notification";

// API functions

async function getPushNotifications(filters: PushNotificationsFilters) {
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });
  const response = await controlPrivateApi.get(
    `/notifications/load?${queryParams}`,
  );
  return response.data as PushNotificationsResponse;
}

async function getPendingNotifications() {
  const response = await controlPrivateApi.get("/notifications/pending");
  return response.data as PushNotificationsResponse;
}

async function getPushNotification(id: number) {
  const response = await controlPrivateApi.get(`/notifications/show/${id}`);
  return response.data.data as PushNotificationDetail;
}

async function createPushNotification(data: CreatePushNotificationRequest) {
  const response = await controlPrivateApi.post("/notifications/add", data);
  return response.data as { message: string; data: { id: number } };
}

async function updatePushNotification(
  id: number,
  data: UpdatePushNotificationRequest,
) {
  const response = await controlPrivateApi.post(
    `/notifications/update/${id}`,
    data,
  );
  return response.data as { message: string };
}

async function deletePushNotification(id: number) {
  const response = await controlPrivateApi.delete(
    `/notifications/delete/${id}`,
  );
  return response.data as { message: string };
}

async function sendPushNotification(id: number) {
  const response = await controlPrivateApi.post(`/notifications/send/${id}`);
  return response.data as { message: string };
}

async function schedulePushNotification(
  id: number,
  scheduledAt: string,
) {
  const response = await controlPrivateApi.post(
    `/notifications/schedule/${id}`,
    { scheduled_at: scheduledAt },
  );
  return response.data as { message: string };
}

async function resendPushNotification(id: number) {
  const response = await controlPrivateApi.post(
    `/notifications/resend/${id}`,
  );
  return response.data as { message: string; data: { id: number } };
}

async function approvePushNotification(id: number) {
  const response = await controlPrivateApi.post(
    `/notifications/approve/${id}`,
  );
  return response.data as { message: string };
}

async function rejectPushNotification(
  id: number,
  rejectionReason: string,
) {
  const response = await controlPrivateApi.post(
    `/notifications/reject/${id}`,
    { rejection_reason: rejectionReason },
  );
  return response.data as { message: string };
}

async function getTargetingPreview(params: {
  target_type: string;
  target_filters?: Record<string, unknown> | null;
}) {
  const response = await controlPrivateApi.post(
    "/notifications/targeting-preview",
    params,
  );
  return response.data as { count: number };
}

async function getNotificationSettings() {
  const response = await controlPrivateApi.get("/notification-settings/load");
  return response.data as NotificationSettingsResponse;
}

async function updateNotificationSettings(
  settings: Array<{
    id: number;
    is_active: boolean;
    channels: string[];
  }>,
) {
  const response = await controlPrivateApi.post(
    "/notification-settings/update",
    { settings },
  );
  return response.data as { message: string };
}

async function syncNotificationSettings() {
  const response = await controlPrivateApi.post(
    "/notification-settings/sync",
  );
  return response.data as { message: string; added: number };
}

// Query options

export const pushNotificationsQueryOptions = (
  filters: PushNotificationsFilters,
) =>
  queryOptions({
    queryKey: ["push-notifications", filters],
    queryFn: () => getPushNotifications(filters),
    staleTime: 30 * 1000,
  });

export const pendingNotificationsQueryOptions = () =>
  queryOptions({
    queryKey: ["push-notifications-pending"],
    queryFn: getPendingNotifications,
    staleTime: 30 * 1000,
  });

export const pushNotificationQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["push-notification", id],
    queryFn: () => getPushNotification(id),
    enabled: !!id,
  });

export const notificationSettingsQueryOptions = () =>
  queryOptions({
    queryKey: ["notification-settings"],
    queryFn: getNotificationSettings,
    staleTime: 5 * 60 * 1000,
  });

// Hooks

export function usePushNotifications(filters: PushNotificationsFilters) {
  return useQuery(pushNotificationsQueryOptions(filters));
}

export function usePendingNotifications() {
  return useQuery(pendingNotificationsQueryOptions());
}

export function usePushNotification(id: number) {
  return useQuery(pushNotificationQueryOptions(id));
}

export function useNotificationSettings() {
  return useQuery(notificationSettingsQueryOptions());
}

export function useCreatePushNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPushNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-notifications"] });
    },
  });
}

export function useUpdatePushNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePushNotificationRequest }) =>
      updatePushNotification(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["push-notification"] });
    },
  });
}

export function useDeletePushNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePushNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["push-notifications-pending"] });
    },
  });
}

export function useSendPushNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendPushNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["push-notification"] });
    },
  });
}

export function useSchedulePushNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, scheduledAt }: { id: number; scheduledAt: string }) =>
      schedulePushNotification(id, scheduledAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["push-notification"] });
    },
  });
}

export function useResendPushNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resendPushNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-notifications"] });
    },
  });
}

export function useApprovePushNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approvePushNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["push-notifications-pending"] });
      queryClient.invalidateQueries({ queryKey: ["push-notification"] });
    },
  });
}

export function useRejectPushNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      rejectPushNotification(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["push-notifications-pending"] });
      queryClient.invalidateQueries({ queryKey: ["push-notification"] });
    },
  });
}

export function useTargetingPreview() {
  return useMutation({
    mutationFn: getTargetingPreview,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
    },
  });
}

export function useSyncNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncNotificationSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
    },
  });
}

export type { PushNotification, PushNotificationDetail, NotificationSetting };
