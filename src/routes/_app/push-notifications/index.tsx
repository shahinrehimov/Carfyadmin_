import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  Clock,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@uidotdev/usehooks";
import Add from "./-popups/Add";
import Show from "./-popups/Show";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import Modal from "@/components/ui/modal";
import Pagination from "@/components/ui/pagination";
import DeleteModal from "@/components/ui/delete-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  usePushNotifications,
  usePendingNotifications,
  useDeletePushNotification,
  useResendPushNotification,
  useSendPushNotification,
  type PushNotification,
} from "@/lib/queries/push-notifications";
import { useTranslation } from "@/lib/utils/translationLoader";
import type { PushNotificationStatus } from "@/lib/types/push-notification";

export const Route = createFileRoute("/_app/push-notifications/")({
  component: RouteComponent,
});

function statusBadge(
  status: PushNotificationStatus,
  t: (k: string) => string,
) {
  const map: Record<
    PushNotificationStatus,
    {
      label: string;
      variant:
        | "default"
        | "secondary"
        | "outline"
        | "destructive"
        | "success"
        | "warning"
        | "info";
    }
  > = {
    draft:            { label: t("status_draft"),            variant: "outline" },
    pending_approval: { label: t("status_pending_approval"), variant: "warning" },
    approved:         { label: t("status_approved"),         variant: "info" },
    rejected:         { label: t("status_rejected"),         variant: "destructive" },
    sending:          { label: t("status_sending"),          variant: "secondary" },
    sent:             { label: t("status_sent"),             variant: "success" },
    cancelled:        { label: t("status_cancelled"),        variant: "outline" },
  };
  const { label, variant } = map[status] ?? {
    label: status,
    variant: "outline" as const,
  };
  return <Badge variant={variant}>{label}</Badge>;
}

function sourceBadge(source: string, t: (k: string) => string) {
  if (source === "seller")
    return <Badge variant="secondary">{t("source_seller")}</Badge>;
  if (source === "admin")
    return <Badge variant="info">{t("source_admin")}</Badge>;
  return <Badge variant="outline">{t("source_system")}</Badge>;
}

type ModalState =
  | { type: null }
  | { type: "add" }
  | { type: "show"; id: number }
  | { type: "delete"; data: PushNotification }
  | { type: "resend"; data: PushNotification };

function RouteComponent() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");

  const [filters, setFilters] = useState({
    page: 1,
    source: "",
    status: "",
    date_from: "",
    date_to: "",
  });

  const [modal, setModal] = useState<ModalState>({ type: null });

  const SOURCE_OPTIONS = [
    { value: "",       label: t("all_sources") },
    { value: "admin",  label: t("source_admin") },
    { value: "seller", label: t("source_seller") },
    { value: "system", label: t("source_system") },
  ];

  const STATUS_OPTIONS = [
    { value: "",                 label: t("all_statuses") },
    { value: "draft",            label: t("status_draft") },
    { value: "pending_approval", label: t("status_pending_approval") },
    { value: "approved",         label: t("status_approved") },
    { value: "rejected",         label: t("status_rejected") },
    { value: "sending",          label: t("status_sending") },
    { value: "sent",             label: t("status_sent") },
    { value: "cancelled",        label: t("status_cancelled") },
  ];

  const {
    data: allData,
    isLoading: allLoading,
    error: allError,
  } = usePushNotifications({
    page: filters.page,
    source: filters.source || undefined,
    status: filters.status || undefined,
    date_from: filters.date_from || undefined,
    date_to: filters.date_to || undefined,
  });

  const { data: pendingData, isLoading: pendingLoading } =
    usePendingNotifications();
  const deleteMutation = useDeletePushNotification();
  const resendMutation = useResendPushNotification();
  const sendMutation = useSendPushNotification();

  const activeData = activeTab === "all" ? allData : pendingData;
  const isLoading = activeTab === "all" ? allLoading : pendingLoading;
  const notifications = activeData?.data ?? [];
  const total = activeData?.meta.total ?? 0;
  const lastPage = activeData?.meta.last_page ?? 1;
  const pendingCount = pendingData?.meta.total ?? 0;

  const handleDelete = async () => {
    if (modal.type !== "delete") return;
    try {
      await deleteMutation.mutateAsync(modal.data.id);
      toast.success(t("deleted_successfully"));
      setModal({ type: null });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const handleResend = async () => {
    if (modal.type !== "resend") return;
    try {
      await resendMutation.mutateAsync(modal.data.id);
      toast.success(t("notification_resending"));
      setModal({ type: null });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const handleSend = async (id: number) => {
    try {
      await sendMutation.mutateAsync(id);
      toast.success(t("notification_sending"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const canDelete = (n: PushNotification) =>
    n.status === "draft" || n.status === "pending_approval";
  const canResend = (n: PushNotification) =>
    n.status === "sent" || n.status === "cancelled";
  const canSend = (n: PushNotification) =>
    n.status === "approved" || n.status === "draft";

  const NoData = () => (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Bell className="h-12 w-12 text-gray-300" />
      <p className="text-lg text-gray-500">{t("no_data_found")}</p>
    </div>
  );

  const DesktopView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">#</TableHead>
          <TableHead>{t("title")}</TableHead>
          <TableHead>{t("source")}</TableHead>
          <TableHead>{t("status")}</TableHead>
          <TableHead>{t("target")}</TableHead>
          <TableHead>{t("channels")}</TableHead>
          <TableHead>{t("recipients")}</TableHead>
          <TableHead>{t("sent_at")}</TableHead>
          <TableHead className="w-[130px]">{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <TableRow key={i}>
              {[...Array(9)].map((_, j) => (
                <TableCell key={j}>
                  <div className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : notifications.length > 0 ? (
          notifications.map((n, index) => (
            <TableRow key={n.id}>
              <TableCell>{(filters.page - 1) * 10 + index + 1}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium line-clamp-1">{n.title}</p>
                  {n.sender && (
                    <p className="text-xs text-gray-500">{n.sender.name}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>{sourceBadge(n.source, t)}</TableCell>
              <TableCell>{statusBadge(n.status, t)}</TableCell>
              <TableCell>
                <span className="text-sm">
                  {n.target_type === "bulk" ? t("target_bulk") : t("target_individual")}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {n.channels.map((ch) => (
                    <span
                      key={ch}
                      className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium uppercase dark:bg-gray-800"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell>{n.total_recipients}</TableCell>
              <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                {n.sent_at ?? n.scheduled_at ?? "—"}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title={t("view")}
                    onClick={() => setModal({ type: "show", id: n.id })}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canSend(n) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title={t("send")}
                      onClick={() => handleSend(n.id)}
                      disabled={sendMutation.isPending}
                    >
                      <Send className="h-4 w-4 text-blue-600" />
                    </Button>
                  )}
                  {canResend(n) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title={t("resend")}
                      onClick={() => setModal({ type: "resend", data: n })}
                    >
                      <RefreshCw className="h-4 w-4 text-green-600" />
                    </Button>
                  )}
                  {canDelete(n) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title={t("delete")}
                      onClick={() => setModal({ type: "delete", data: n })}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={9}>
              <NoData />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  const MobileView = () => (
    <div className="space-y-4">
      {isLoading ? (
        [...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse border-b border-border p-4">
            <div className="mb-2 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))
      ) : notifications.length > 0 ? (
        notifications.map((n) => (
          <Card key={n.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{n.title}</h3>
                {n.sender && (
                  <p className="text-xs text-gray-500">{n.sender.name}</p>
                )}
              </div>
              {statusBadge(n.status, t)}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {sourceBadge(n.source, t)}
              {n.channels.map((ch) => (
                <span
                  key={ch}
                  className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium uppercase dark:bg-gray-800"
                >
                  {ch}
                </span>
              ))}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {n.target_type === "bulk" ? t("target_bulk") : t("target_individual")}
              {" · "}
              {n.total_recipients} {t("recipients")}
            </p>
            <div className="mt-3 flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setModal({ type: "show", id: n.id })}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {canSend(n) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSend(n.id)}
                  disabled={sendMutation.isPending}
                >
                  <Send className="h-4 w-4 text-blue-600" />
                </Button>
              )}
              {canResend(n) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setModal({ type: "resend", data: n })}
                >
                  <RefreshCw className="h-4 w-4 text-green-600" />
                </Button>
              )}
              {canDelete(n) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setModal({ type: "delete", data: n })}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              )}
            </div>
          </Card>
        ))
      ) : (
        <NoData />
      )}
    </div>
  );

  if (allError) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600">{t("an_error_occurred")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">
          {t("push_notifications")}
        </h1>
        <Button
          onClick={() => setModal({ type: "add" })}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("new_notification")}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "all"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => {
            setActiveTab("all");
            setFilters((f) => ({ ...f, page: 1 }));
          }}
        >
          {t("all")}
        </button>
        <button
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "pending"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => {
            setActiveTab("pending");
            setFilters((f) => ({ ...f, page: 1 }));
          }}
        >
          <Clock className="h-3.5 w-3.5" />
          {t("pending_approval")}
          {pendingCount > 0 && (
            <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters */}
      {activeTab === "all" && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="w-full sm:w-48">
            <Select
              value={filters.source}
              onValueChange={(val) =>
                setFilters((f) => ({ ...f, source: val, page: 1 }))
              }
              options={SOURCE_OPTIONS}
              placeholder={t("source")}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={filters.status}
              onValueChange={(val) =>
                setFilters((f) => ({ ...f, status: val, page: 1 }))
              }
              options={STATUS_OPTIONS}
              placeholder={t("status")}
            />
          </div>
          <div className="flex-1" />
        </div>
      )}

      <div className="overflow-hidden p-0">
        {isMobile ? <MobileView /> : <DesktopView />}
      </div>

      <Pagination
        currentPage={filters.page}
        totalPages={lastPage}
        pageSize={10}
        totalItems={total}
        onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
        onPageSizeChange={() => {}}
        disabled={isLoading}
      />

      <Modal
        isOpen={modal.type === "add"}
        onClose={() => setModal({ type: null })}
        title={t("new_notification")}
        size="lg"
      >
        <Add onClose={() => setModal({ type: null })} />
      </Modal>

      <Modal
        isOpen={modal.type === "show"}
        onClose={() => setModal({ type: null })}
        title={t("notification_detail")}
        size="lg"
      >
        {modal.type === "show" && (
          <Show id={modal.id} onClose={() => setModal({ type: null })} />
        )}
      </Modal>

      <Modal
        isOpen={modal.type === "delete"}
        onClose={() => setModal({ type: null })}
        title={t("delete_notification")}
        size="sm"
      >
        <DeleteModal
          closeModal={() => setModal({ type: null })}
          handleDelete={handleDelete}
          pending={deleteMutation.isPending}
        />
      </Modal>

      <Modal
        isOpen={modal.type === "resend"}
        onClose={() => setModal({ type: null })}
        title={t("resend_notification")}
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
            <RefreshCw className="h-5 w-5 shrink-0 text-blue-600" />
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {t("resend_notification_info")}
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setModal({ type: null })}>
              {t("cancel")}
            </Button>
            <Button onClick={handleResend} disabled={resendMutation.isPending}>
              {resendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t("resend")}
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
