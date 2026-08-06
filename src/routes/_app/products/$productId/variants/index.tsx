import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Eye,
  History,
  Image as ImageIcon,
  Loader2,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import DeleteModal from "@/components/ui/delete-modal";
import Pagination from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  getCpvImage,
  useAdminCPVHistory,
  useAdminCPVs,
  useApproveCPV,
  useApproveRevision,
  useDeleteCPV,
  useRejectCPV,
  useRejectRevision,
  useToggleCPVStatus,
  useVariantRevisions,
  type AdminCPV,
  type ApprovalHistoryItem,
  type VariantRevision,
} from "@/lib/queries/products";
import { useCompaniesList } from "@/lib/queries/companies";
import { FitmentSummary } from "@/components/fitment/FitmentSummary";
import { useTranslation } from "@/lib/utils/translationLoader";

export const Route = createFileRoute("/_app/products/$productId/variants/")({
  component: RouteComponent,
});

type ModalState =
  | { type: null }
  | { type: "history"; cpv: AdminCPV }
  | { type: "approve"; cpv: AdminCPV }
  | { type: "reject"; cpv: AdminCPV }
  | { type: "revisions"; variantId: number }
  | { type: "delete"; cpv: AdminCPV };

function ApprovalStatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
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

function HistoryModal({
  cpvId,
  onClose,
}: {
  cpvId: number;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { data, isLoading } = useAdminCPVHistory(cpvId, true);
  const history = data?.data || [];

  return (
    <div className="space-y-4">
      {isLoading ? (
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
                <span className="text-xs text-gray-400">
                  {item.created_date}
                </span>
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
        <Button variant="outline" onClick={onClose}>
          {t("close")}
        </Button>
      </div>
    </div>
  );
}

function RevisionsModal({
  variantId,
  onClose,
}: {
  variantId: number;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const {
    data: revisions,
    isLoading,
    refetch,
  } = useVariantRevisions(variantId, true);
  const approveMutation = useApproveRevision();
  const rejectMutation = useRejectRevision();
  const [rejectMessage, setRejectMessage] = useState("");
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const handleApprove = async (revision: VariantRevision) => {
    try {
      await approveMutation.mutateAsync(revision.id);
      toast.success(t("approved_successfully"));
      refetch();
    } catch {
      toast.error(t("error_occurred"));
    }
  };

  const handleReject = async (revisionId: number) => {
    try {
      await rejectMutation.mutateAsync({
        id: revisionId,
        message: rejectMessage,
      });
      toast.success(t("rejected_successfully"));
      setRejectingId(null);
      setRejectMessage("");
      refetch();
    } catch {
      toast.error(t("error_occurred"));
    }
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : !revisions?.length ? (
        <p className="py-6 text-center text-gray-500">{t("no_data_found")}</p>
      ) : (
        <div className="space-y-4">
          {revisions.map((revision) => (
            <div key={revision.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {revision.status === "pending" && (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                  {revision.status === "approved" && (
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approved
                    </Badge>
                  )}
                  {revision.status === "rejected" && (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Rejected
                    </Badge>
                  )}
                  {revision.company && (
                    <span className="text-sm text-gray-500">
                      {revision.company.title}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {revision.created_date}
                </span>
              </div>

              {/* Before / After comparison */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded bg-gray-50 dark:bg-gray-800 p-3 space-y-1">
                  <p className="font-semibold text-xs text-gray-500 mb-2">
                    {t("current") || "Cari"}
                  </p>
                  <p>
                    <span className="text-gray-500">OEM:</span>{" "}
                    {revision.current.oem_code || "—"}
                  </p>
                  <div className="flex items-start gap-1">
                    <span className="text-gray-500 shrink-0">
                      {t("fitment") || "Uyğunluq"}:
                    </span>
                    <FitmentSummary
                      fitments={revision.current.fitments}
                      isUniversal={revision.current.is_universal}
                    />
                  </div>
                </div>
                <div className="rounded bg-blue-50 dark:bg-blue-950 p-3 space-y-1">
                  <p className="font-semibold text-xs text-blue-600 mb-2">
                    {t("proposed") || "Təklif olunan"}
                  </p>
                  <p>
                    <span className="text-gray-500">OEM:</span>{" "}
                    {revision.data.oem_code || "—"}
                  </p>
                  <div className="flex items-start gap-1">
                    <span className="text-gray-500 shrink-0">
                      {t("fitment") || "Uyğunluq"}:
                    </span>
                    <FitmentSummary
                      fitments={revision.data.fitments}
                      isUniversal={revision.data.fitments?.every(
                        (f) => f.brand === null,
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Images */}
              {(revision.images.main_image ||
                revision.images.images.length > 0) && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500">
                    {t("images")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {revision.images.main_image && (
                      <img
                        src={revision.images.main_image}
                        alt="main"
                        className="h-16 w-16 rounded object-cover border"
                      />
                    )}
                    {revision.images.hover_image && (
                      <img
                        src={revision.images.hover_image}
                        alt="hover"
                        className="h-16 w-16 rounded object-cover border"
                      />
                    )}
                    {revision.images.images.map((img) => (
                      <img
                        key={img.id}
                        src={img.url}
                        alt=""
                        className="h-16 w-16 rounded object-cover border"
                      />
                    ))}
                  </div>
                </div>
              )}

              {revision.rejection_message && (
                <p className="rounded bg-red-50 dark:bg-red-950 p-2 text-sm text-red-700">
                  {revision.rejection_message}
                </p>
              )}

              {revision.status === "pending" && (
                <div className="space-y-2">
                  {rejectingId === revision.id ? (
                    <div className="space-y-2">
                      <textarea
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        rows={2}
                        placeholder={
                          t("rejection_message") || "Rədd etmə səbəbi..."
                        }
                        value={rejectMessage}
                        onChange={(e) => setRejectMessage(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(revision.id)}
                          disabled={rejectMutation.isPending}
                        >
                          {rejectMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            t("confirm_reject") || "Rədd et"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRejectingId(null)}
                        >
                          {t("cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(revision)}
                        disabled={approveMutation.isPending}
                      >
                        {approveMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t("approve")}
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setRejectingId(revision.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        {t("reject")}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          {t("close")}
        </Button>
      </div>
    </div>
  );
}

function ApproveModal({
  cpv,
  onClose,
}: {
  cpv: AdminCPV;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const approveMutation = useApproveCPV();

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(cpv.id);
      toast.success(t("approved_successfully"));
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t("failed_to_approve"));
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-600">
        {t("approve_variant_confirm")}{" "}
        <span className="font-medium">
          {cpv.variant?.title || cpv.variant?.slug}
        </span>
        ?
      </p>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={onClose}
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
  );
}

function RejectModal({ cpv, onClose }: { cpv: AdminCPV; onClose: () => void }) {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const rejectMutation = useRejectCPV();

  const handleReject = async () => {
    try {
      await rejectMutation.mutateAsync({
        id: cpv.id,
        message: message || undefined,
      });
      toast.success(t("rejected_successfully"));
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t("failed_to_reject"));
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-600">
        {t("reject_variant_confirm")}{" "}
        <span className="font-medium">
          {cpv.variant?.title || cpv.variant?.slug}
        </span>
      </p>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("message")}{" "}
          <span className="font-normal text-gray-400">({t("optional")})</span>
        </label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("rejection_reason_placeholder")}
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={onClose}
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
  );
}

function RouteComponent() {
  const { t } = useTranslation();
  const { productId } = Route.useParams();
  const id = Number(productId);

  const [filters, setFilters] = useState<{
    page: number;
    product_id: number;
    company_id?: number;
  }>({ page: 1, product_id: id });
  const [modalState, setModalState] = useState<ModalState>({ type: null });

  const { data, isLoading, error } = useAdminCPVs(filters);
  const { data: companiesData } = useCompaniesList();
  const toggleStatusMutation = useToggleCPVStatus();
  const deleteCPVMutation = useDeleteCPV();

  const handleDeleteCPV = async (cpv: AdminCPV) => {
    try {
      await deleteCPVMutation.mutateAsync(cpv.id);
      toast.success(t("deleted_successfully"));
      closeModal();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t("failed_to_delete"));
    }
  };

  const handleToggleStatus = async (cpv: AdminCPV) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: cpv.id,
        isActive: cpv.is_active,
      });
      toast.success(t("status_updated_successfully"));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t("failed_to_update_status"));
    }
  };

  const cpvs = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);
  const productTitle = cpvs[0]?.variant?.product?.title;

  const closeModal = () => setModalState({ type: null });

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600">{t("error_loading_data")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">{t("variants")}</h1>
            {productTitle && (
              <p className="text-sm text-gray-500">{productTitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Seller Filter */}
      <div className="flex items-center gap-3">
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={filters.company_id?.toString() || ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              page: 1,
              company_id: e.target.value ? Number(e.target.value) : undefined,
            }))
          }
        >
          <option value="">{t("all_sellers") || "Bütün sellerlər"}</option>
          {(companiesData || []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead className="w-[80px]">{t("image")}</TableHead>
              <TableHead>{t("title")}</TableHead>
              <TableHead>{t("seller")}</TableHead>
              <TableHead>{t("price")}</TableHead>
              <TableHead>{t("commission", "Komissiya")}</TableHead>
              <TableHead>{t("site_price", "Saytda qiymət")}</TableHead>
              <TableHead>{t("stock")}</TableHead>
              <TableHead>{t("city")}</TableHead>
              <TableHead>{t("fitment") || "Uyğunluq"}</TableHead>
              <TableHead>{t("approval_status")}</TableHead>
              <TableHead className="w-[80px]">{t("status")}</TableHead>
              <TableHead className="w-[160px]">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(12)].map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 animate-pulse rounded bg-gray-200" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : cpvs.length > 0 ? (
              cpvs.map((cpv, index) => {
                const image = getCpvImage(cpv);

                return (
                <TableRow key={cpv.id}>
                  <TableCell>
                    {filters.page * perPage - perPage + index + 1}
                  </TableCell>
                  <TableCell>
                    {image ? (
                      <img
                        src={image}
                        alt={cpv.variant?.title || cpv.variant?.slug || ""}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <span className="line-clamp-2 text-sm font-medium">
                      {cpv.variant?.title || cpv.variant?.slug}
                    </span>
                    {cpv.variant?.oem_code && (
                      <span className="text-xs text-gray-400">
                        OEM: {cpv.variant.oem_code}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {cpv.company?.title || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{cpv.price_final} ₼</span>
                      {cpv.discount > 0 && (
                        <span className="text-xs text-gray-400 line-through">
                          {cpv.price} ₼
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {cpv.commission_percent != null
                      ? `${cpv.commission_percent}%`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {cpv.site_price_final != null
                        ? `${cpv.site_price_final} ₼`
                        : "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={cpv.stock > 0 ? "default" : "destructive"}>
                      {cpv.stock}
                    </Badge>
                  </TableCell>
                  <TableCell>{cpv.city?.title || "—"}</TableCell>
                  <TableCell>
                    <FitmentSummary
                      fitments={cpv.variant?.fitments}
                      isUniversal={cpv.variant?.is_universal}
                    />
                  </TableCell>
                  <TableCell>
                    <ApprovalStatusBadge
                      status={cpv.approval_status}
                      label={cpv.approval_status_label}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={cpv.is_active}
                      onCheckedChange={() => handleToggleStatus(cpv)}
                      disabled={toggleStatusMutation.isPending}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {cpv.variant?.id && (
                        <Link
                          to="/products/$productId/variants/$variantId"
                          params={{
                            productId,
                            variantId: String(cpv.variant.id),
                          }}
                        >
                          <Button variant="ghost" size="icon" title={t("view")}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t("history")}
                        onClick={() => setModalState({ type: "history", cpv })}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      {cpv.variant?.id && cpv.variant?.has_pending_revision && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t("revisions") || "Redaktə təklifləri"}
                          className="text-yellow-600 hover:text-yellow-700"
                          onClick={() =>
                            setModalState({
                              type: "revisions",
                              variantId: cpv.variant!.id,
                            })
                          }
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      )}
                      {cpv.approval_status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("approve")}
                            className="text-green-600 hover:text-green-700"
                            onClick={() =>
                              setModalState({ type: "approve", cpv })
                            }
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("reject")}
                            className="text-red-600 hover:text-red-700"
                            onClick={() =>
                              setModalState({ type: "reject", cpv })
                            }
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t("delete")}
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setModalState({ type: "delete", cpv })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={14}
                  className="py-12 text-center text-gray-500"
                >
                  {t("no_data_found")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-4 md:hidden">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-lg bg-gray-200"
            />
          ))
        ) : cpvs.length > 0 ? (
          cpvs.map((cpv, index) => {
            const image = getCpvImage(cpv);

            return (
            <Card key={cpv.id} className="p-4">
              <div className="flex items-start gap-3">
                {image ? (
                  <img
                    src={image}
                    alt={cpv.variant?.title || cpv.variant?.slug || ""}
                    className="h-16 w-16 rounded object-cover"
                  />
                ) : (
                  <ImageIcon className="h-16 w-16 text-gray-400" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {filters.page * perPage - perPage + index + 1}.{" "}
                    {cpv.variant?.title || cpv.variant?.slug}
                  </p>
                  {cpv.company?.title && (
                    <p className="text-xs text-gray-500">{cpv.company.title}</p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <ApprovalStatusBadge
                      status={cpv.approval_status}
                      label={cpv.approval_status_label}
                    />
                    <Badge variant={cpv.stock > 0 ? "default" : "destructive"}>
                      {t("stock")}: {cpv.stock}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm font-medium">
                    {cpv.price_final} ₼
                  </p>
                  <p className="text-xs text-gray-400">
                    {cpv.city?.title} ·{" "}
                    <FitmentSummary
                      inline
                      fitments={cpv.variant?.fitments}
                      isUniversal={cpv.variant?.is_universal}
                    />
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <Switch
                  checked={cpv.is_active}
                  onCheckedChange={() => handleToggleStatus(cpv)}
                  disabled={toggleStatusMutation.isPending}
                />
                <div className="flex items-center gap-1">
                  {cpv.variant?.id && (
                    <Link
                      to="/products/$productId/variants/$variantId"
                      params={{ productId, variantId: String(cpv.variant.id) }}
                    >
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setModalState({ type: "history", cpv })}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                  {cpv.approval_status === "pending" && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-green-600"
                        onClick={() => setModalState({ type: "approve", cpv })}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => setModalState({ type: "reject", cpv })}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600"
                    onClick={() => setModalState({ type: "delete", cpv })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
            );
          })
        ) : (
          <p className="py-12 text-center text-gray-500">
            {t("no_data_found")}
          </p>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={filters.page}
        totalPages={totalPages}
        pageSize={perPage}
        totalItems={total}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        onPageSizeChange={() => {}}
        disabled={isLoading}
      />

      {/* History Modal */}
      <Modal
        isOpen={modalState.type === "history"}
        onClose={closeModal}
        title={t("approval_history")}
        size="md"
      >
        {modalState.type === "history" && (
          <HistoryModal cpvId={modalState.cpv.id} onClose={closeModal} />
        )}
      </Modal>

      {/* Approve Modal */}
      <Modal
        isOpen={modalState.type === "approve"}
        onClose={closeModal}
        title={t("approve_variant")}
        size="sm"
      >
        {modalState.type === "approve" && (
          <ApproveModal cpv={modalState.cpv} onClose={closeModal} />
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={modalState.type === "reject"}
        onClose={closeModal}
        title={t("reject_variant")}
        size="md"
      >
        {modalState.type === "reject" && (
          <RejectModal cpv={modalState.cpv} onClose={closeModal} />
        )}
      </Modal>

      {/* Revisions Modal */}
      <Modal
        isOpen={modalState.type === "revisions"}
        onClose={closeModal}
        title={t("revisions") || "Redaktə təklifləri"}
        size="lg"
      >
        {modalState.type === "revisions" && (
          <RevisionsModal
            variantId={modalState.variantId}
            onClose={closeModal}
          />
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={modalState.type === "delete"}
        onClose={closeModal}
        title={t("delete_listing") || "Elanı sil"}
        size="sm"
      >
        {modalState.type === "delete" && (
          <DeleteModal
            title={`${t("delete_confirm_message") || "Silmək istədiyinizə əminsiniz?"} "${modalState.cpv.variant?.title || modalState.cpv.variant?.slug}"${modalState.cpv.company?.title ? ` — ${modalState.cpv.company.title}` : ""}`}
            closeModal={closeModal}
            handleDelete={() => handleDeleteCPV(modalState.cpv)}
            pending={deleteCPVMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
}
