import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  History,
  Image as ImageIcon,
  Loader2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useProductVariant,
  useToggleVariantStatus,
  useVariantApprovalHistory,
  useApproveVariant,
  useRejectVariant,
} from "@/lib/queries/products";
import type { ApprovalHistoryItem } from "@/lib/queries/products";
import { useTranslation } from "@/lib/utils/translationLoader";

export const Route = createFileRoute(
  "/_app/products/$productId/variants/$variantId/",
)({
  component: RouteComponent,
});

type ModalType = null | "history" | "approve" | "reject";

function ApprovalStatusBadge({ status, label }: { status: string; label: string }) {
  if (status === "approved")
    return (
      <Badge variant="default" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        {label}
      </Badge>
    );
  if (status === "rejected")
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        {label}
      </Badge>
    );
  return (
    <Badge variant="secondary" className="gap-1">
      <Clock className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function RouteComponent() {
  const { t } = useTranslation();
  const { productId, variantId } = Route.useParams();
  const id = Number(variantId);

  const [modalType, setModalType] = useState<ModalType>(null);
  const [rejectMessage, setRejectMessage] = useState("");

  const { data: variant, isLoading, error } = useProductVariant(id);
  const { data: historyData, isLoading: historyLoading } = useVariantApprovalHistory(
    id,
    modalType === "history",
  );
  const toggleStatusMutation = useToggleVariantStatus();
  const approveMutation = useApproveVariant();
  const rejectMutation = useRejectVariant();

  const handleToggleStatus = async () => {
    if (!variant) return;
    try {
      await toggleStatusMutation.mutateAsync(variant.id);
      toast.success(t("status_updated_successfully"));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t("failed_to_update_status"));
    }
  };

  const handleApprove = async () => {
    if (!variant) return;
    try {
      await approveMutation.mutateAsync(variant.id);
      toast.success(t("approved_successfully"));
      setModalType(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t("failed_to_approve"));
    }
  };

  const handleReject = async () => {
    if (!variant) return;
    try {
      await rejectMutation.mutateAsync({ id: variant.id, message: rejectMessage || undefined });
      toast.success(t("rejected_successfully"));
      setModalType(null);
      setRejectMessage("");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t("failed_to_reject"));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 py-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !variant) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600">{t("error_loading_data")}</p>
        <Link to="/products/$productId/variants" params={{ productId }}>
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("back")}
          </Button>
        </Link>
      </div>
    );
  }

  const history = historyData?.data || [];

  const approvalStatusMessage = variant.approval_status_message;

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/products/$productId/variants" params={{ productId }}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{variant.slug}</h1>
          <ApprovalStatusBadge
            status={variant.approval_status}
            label={variant.approval_status_label}
          />
          <Badge variant={variant.is_active ? "default" : "secondary"}>
            {variant.is_active ? t("active") : t("inactive")}
          </Badge>
          {variant.is_default && (
            <Badge variant="outline">{t("default")}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalType("history")}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            {t("history")}
          </Button>
          {variant.approval_status === "pending" && (
            <>
              <Button
                size="sm"
                onClick={() => setModalType("approve")}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {t("approve")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setModalType("reject")}
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                {t("reject")}
              </Button>
            </>
          )}
        </div>
      </div>

      {approvalStatusMessage && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200">
          <p className="font-medium">{t("rejection_message")}:</p>
          <p className="mt-1">{approvalStatusMessage}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Images */}
        <Card className="p-6 lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {t("images")}
          </h2>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs text-gray-500">{t("main_image")}</p>
              {variant.main_image ? (
                <img
                  src={variant.main_image}
                  alt="main"
                  className="h-40 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-lg bg-gray-100">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-500">{t("hover_image")}</p>
              {variant.hover_image ? (
                <img
                  src={variant.hover_image}
                  alt="hover"
                  className="h-40 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-lg bg-gray-100">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            {variant.images?.urls && variant.images.urls.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-gray-500">{t("gallery")}</p>
                <div className="grid grid-cols-3 gap-2">
                  {variant.images.urls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`gallery-${i}`}
                      className="h-20 w-full rounded object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Pricing & Stock */}
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              {t("pricing_and_stock")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500">{t("price")}</p>
                <p className="mt-0.5 text-lg font-semibold">{variant.price} ₼</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("final_price")}</p>
                <p className="mt-0.5 text-lg font-semibold text-green-600">
                  {variant.price_final} ₼
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("discount")}</p>
                <p className="mt-0.5 font-medium">
                  {variant.discount > 0
                    ? `${variant.discount}${variant.discount_type === "by_percentage" ? "%" : " ₼"}`
                    : "—"}
                </p>
              </div>
              {variant.discount_start_at && (
                <div>
                  <p className="text-xs text-gray-500">{t("discount_start")}</p>
                  <p className="mt-0.5 text-sm">{variant.discount_start_at}</p>
                </div>
              )}
              {variant.discount_end_at && (
                <div>
                  <p className="text-xs text-gray-500">{t("discount_end")}</p>
                  <p className="mt-0.5 text-sm">{variant.discount_end_at}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">{t("stock")}</p>
                <Badge
                  variant={variant.stock > 0 ? "default" : "destructive"}
                  className="mt-0.5"
                >
                  {variant.stock}
                </Badge>
              </div>
            </div>
          </Card>

          {/* General Info */}
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              {t("general_info")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500">{t("city")}</p>
                <p className="mt-0.5 font-medium">{variant.city?.title ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("brand_model")}</p>
                <p className="mt-0.5 font-medium">{variant.brand_model?.title ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("year")}</p>
                <p className="mt-0.5 font-medium">{variant.year}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("product")}</p>
                <Link
                  to="/products/$productId"
                  params={{ productId }}
                  className="mt-0.5 font-medium text-blue-600 hover:underline"
                >
                  {variant.product.title}
                </Link>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 border-t pt-4">
              <p className="text-sm text-gray-500">{t("status")}</p>
              <Switch
                checked={variant.is_active}
                onCheckedChange={handleToggleStatus}
                disabled={toggleStatusMutation.isPending}
              />
            </div>
          </Card>

          {/* Options */}
          {variant.options && variant.options.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                {t("options")}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {variant.options.map((opt) => {
                  const selectedItem = opt.option.has_items
                    ? opt.option.items.find((item) => item.id === Number(opt.value))
                    : null;

                  return (
                    <div key={opt.id}>
                      <p className="text-xs text-gray-500">
                        {opt.option.title}
                        {opt.option.is_required && (
                          <span className="ml-1 text-red-400">*</span>
                        )}
                      </p>
                      <p className="mt-0.5 font-medium">
                        {selectedItem ? selectedItem.title : String(opt.value) || "—"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* History Modal */}
      <Modal
        isOpen={modalType === "history"}
        onClose={() => setModalType(null)}
        title={t("approval_history")}
        size="md"
      >
        <div className="space-y-4">
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <p className="py-6 text-center text-gray-500">{t("no_data_found")}</p>
          ) : (
            <div className="space-y-3">
              {history.map((item: ApprovalHistoryItem) => (
                <div key={item.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <ApprovalStatusBadge
                      status={item.approval_status}
                      label={item.approval_status_label}
                    />
                    <span className="text-xs text-gray-400">{item.created_date}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {t("by")}: {item.created_user}
                  </p>
                  {item.approval_status_message && (
                    <p className="mt-2 rounded bg-gray-50 p-2 text-sm text-gray-700 dark:bg-gray-800">
                      {item.approval_status_message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setModalType(null)}>
              {t("close")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Approve Confirmation Modal */}
      <Modal
        isOpen={modalType === "approve"}
        onClose={() => setModalType(null)}
        title={t("approve_variant")}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {t("approve_variant_confirm")} <span className="font-medium">{variant.slug}</span>?
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setModalType(null)}
              disabled={approveMutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <CheckCircle className="mr-2 h-4 w-4" />
              {t("approve")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={modalType === "reject"}
        onClose={() => setModalType(null)}
        title={t("reject_variant")}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {t("reject_variant_confirm")}{" "}
            <span className="font-medium">{variant.slug}</span>
          </p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("message")}{" "}
              <span className="font-normal text-gray-400">({t("optional")})</span>
            </label>
            <Textarea
              value={rejectMessage}
              onChange={(e) => setRejectMessage(e.target.value)}
              placeholder={t("rejection_reason_placeholder")}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setModalType(null)}
              disabled={rejectMutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <XCircle className="mr-2 h-4 w-4" />
              {t("reject")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
