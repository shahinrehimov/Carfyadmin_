import React, { useState } from "react";
import { Loader2, CheckCircle, XCircle, RefreshCw, Send, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  usePushNotification,
  useApprovePushNotification,
  useRejectPushNotification,
  useSendPushNotification,
  useSchedulePushNotification,
  useResendPushNotification,
} from "@/lib/queries/push-notifications";
import { useLangs } from "@/lib/queries/langs";
import { useTranslation } from "@/lib/utils/translationLoader";
import type { PushNotificationStatus } from "@/lib/types/push-notification";

interface ShowProps {
  id: number;
  onClose: () => void;
}

const Show: React.FC<ShowProps> = ({ id, onClose }) => {
  const { t } = useTranslation();
  const { data: langs = [] } = useLangs();
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");

  const STATUS_CLASSES: Record<PushNotificationStatus, string> = {
    draft:            "bg-gray-100 text-gray-700 dark:bg-gray-800",
    pending_approval: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    approved:         "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    rejected:         "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    sending:          "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    sent:             "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled:        "bg-gray-100 text-gray-700 dark:bg-gray-800",
  };

  const { data: notification, isLoading } = usePushNotification(id);
  const approveMutation  = useApprovePushNotification();
  const rejectMutation   = useRejectPushNotification();
  const sendMutation     = useSendPushNotification();
  const scheduleMutation = useSchedulePushNotification();
  const resendMutation   = useResendPushNotification();

  const getLangLabel = (languageId: number) => {
    const lang = (langs as any[]).find((l) => l.id === languageId);
    return lang?.title ?? lang?.key?.toUpperCase() ?? `Lang ${languageId}`;
  };

  const handleApprove = async () => {
    try {
      const res = await approveMutation.mutateAsync(id);
      toast.success(res.message || t("notification_approved"));
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error(t("enter_rejection_reason"));
      return;
    }
    try {
      const res = await rejectMutation.mutateAsync({ id, reason: rejectionReason.trim() });
      toast.success(res.message || t("notification_rejected"));
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const handleSend = async () => {
    try {
      const res = await sendMutation.mutateAsync(id);
      toast.success(res.message || t("notification_sending"));
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const handleSchedule = async () => {
    if (!scheduledAt) {
      toast.error(t("select_date"));
      return;
    }
    try {
      const res = await scheduleMutation.mutateAsync({ id, scheduledAt });
      toast.success(res.message || t("notification_scheduled"));
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const handleResend = async () => {
    try {
      const res = await resendMutation.mutateAsync(id);
      toast.success(res.message || t("notification_resending"));
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!notification) return null;

  const s = notification.status;
  const statusClass = STATUS_CLASSES[s] ?? "bg-gray-100 text-gray-700";
  const statusLabel = t(`status_${s}`);

  return (
    <div className="space-y-5">
      {/* Status & source */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>
          {statusLabel}
        </span>
        {notification.source === "seller" && (
          <Badge variant="secondary">{t("seller_notification")}</Badge>
        )}
        {notification.source === "admin" && (
          <Badge variant="info">{t("admin_notification")}</Badge>
        )}
      </div>

      {/* Sender */}
      {notification.sender && (
        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
            {t("sender")}
          </p>
          <p className="text-sm font-medium">{notification.sender.name}</p>
          <p className="text-xs text-gray-400">{notification.sender.type.split("\\").pop()}</p>
        </div>
      )}

      {/* Rejection reason */}
      {notification.rejection_reason && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
          <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">
            {t("rejection_reason")}
          </p>
          <p className="text-sm text-red-800 dark:text-red-300">{notification.rejection_reason}</p>
        </div>
      )}

      {/* Translations */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">{t("notification_text")}</p>
        {notification.translations.map((tr) => (
          <div key={tr.language_id} className="rounded-lg border p-3 space-y-1">
            <p className="text-xs text-gray-500">{getLangLabel(tr.language_id)}</p>
            <p className="text-sm font-medium">{tr.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{tr.body}</p>
          </div>
        ))}
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500">{t("target_type")}</p>
          <p className="font-medium">
            {notification.target_type === "bulk" ? t("target_bulk") : t("target_individual")}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">{t("recipients")}</p>
          <p className="font-medium">{notification.total_recipients}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">{t("channels")}</p>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {notification.channels.map((ch) => (
              <span key={ch} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs uppercase dark:bg-gray-800">
                {ch}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500">{t("action_type")}</p>
          <p className="font-medium">{notification.action_type}</p>
          {notification.action_id && (
            <p className="text-xs text-gray-400 truncate">{notification.action_id}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-500">{t("created_at")}</p>
          <p className="font-medium">{notification.created_at}</p>
        </div>
        {notification.sent_at && (
          <div>
            <p className="text-xs text-gray-500">{t("sent_at")}</p>
            <p className="font-medium">{notification.sent_at}</p>
          </div>
        )}
        {notification.scheduled_at && (
          <div>
            <p className="text-xs text-gray-500">{t("scheduled_at")}</p>
            <p className="font-medium">{notification.scheduled_at}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t pt-4 space-y-3">
        {/* Pending approval */}
        {s === "pending_approval" && (
          <>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleApprove} disabled={approveMutation.isPending}>
                {approveMutation.isPending
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <CheckCircle className="mr-2 h-4 w-4" />}
                {t("approve")}
              </Button>
              <Button variant="outline"
                className="flex-1 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                onClick={() => setShowRejectForm((v) => !v)}>
                <XCircle className="mr-2 h-4 w-4" />
                {t("reject")}
              </Button>
            </div>
            {showRejectForm && (
              <div className="space-y-2">
                <Textarea
                  placeholder={t("rejection_reason_placeholder")}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
                <Button variant="destructive" className="w-full"
                  onClick={handleReject}
                  disabled={rejectMutation.isPending || !rejectionReason.trim()}>
                  {rejectMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t("reject")}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Send / Schedule */}
        {(s === "approved" || s === "draft") && (
          <div className="space-y-2">
            <Button className="w-full" onClick={handleSend} disabled={sendMutation.isPending}>
              {sendMutation.isPending
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <Send className="mr-2 h-4 w-4" />}
              {t("send_now")}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setShowScheduleForm((v) => !v)}>
              <Clock className="mr-2 h-4 w-4" />
              {t("schedule")}
            </Button>
            {showScheduleForm && (
              <div className="space-y-2">
                <input
                  type="datetime-local"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
                <Button className="w-full" onClick={handleSchedule} disabled={scheduleMutation.isPending}>
                  {scheduleMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t("schedule")}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Resend */}
        {(s === "sent" || s === "cancelled") && (
          <Button variant="outline" className="w-full" onClick={handleResend} disabled={resendMutation.isPending}>
            {resendMutation.isPending
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <RefreshCw className="mr-2 h-4 w-4" />}
            {t("resend")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Show;
