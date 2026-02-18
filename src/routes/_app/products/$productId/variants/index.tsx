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
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Modal from "@/components/ui/modal";
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
  useProductVariants,
  useToggleVariantStatus,
  useVariantApprovalHistory,
  useApproveVariant,
  useRejectVariant,
} from "@/lib/queries/products";
import type { ProductVariant, ApprovalHistoryItem } from "@/lib/queries/products";
import { useTranslation } from "@/lib/utils/translationLoader";

export const Route = createFileRoute("/_app/products/$productId/variants/")({
  component: RouteComponent,
});

type ModalState =
  | { type: null }
  | { type: "history"; variant: ProductVariant }
  | { type: "approve"; variant: ProductVariant }
  | { type: "reject"; variant: ProductVariant };

function ApprovalStatusBadge({ status, label }: { status: string; label: string }) {
  if (status === "approved")
    return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />{label}</Badge>;
  if (status === "rejected")
    return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />{label}</Badge>;
  return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />{label}</Badge>;
}

function HistoryModal({ variantId, onClose }: { variantId: number; onClose: () => void }) {
  const { t } = useTranslation();
  const { data, isLoading } = useVariantApprovalHistory(variantId, true);
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
                <span className="text-xs text-gray-400">{item.created_date}</span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{t("by")}: {item.created_user}</p>
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
        <Button variant="outline" onClick={onClose}>{t("close")}</Button>
      </div>
    </div>
  );
}

function ApproveModal({
  variant,
  onClose,
}: {
  variant: ProductVariant;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const approveMutation = useApproveVariant();

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(variant.id);
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
        {t("approve_variant_confirm")} <span className="font-medium">{variant.slug}</span>?
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={approveMutation.isPending}>
          {t("cancel")}
        </Button>
        <Button onClick={handleApprove} disabled={approveMutation.isPending}>
          {approveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <CheckCircle className="mr-2 h-4 w-4" />
          {t("approve")}
        </Button>
      </div>
    </div>
  );
}

function RejectModal({
  variant,
  onClose,
}: {
  variant: ProductVariant;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const rejectMutation = useRejectVariant();

  const handleReject = async () => {
    try {
      await rejectMutation.mutateAsync({ id: variant.id, message: message || undefined });
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
        {t("reject_variant_confirm")} <span className="font-medium">{variant.slug}</span>
      </p>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("message")} <span className="font-normal text-gray-400">({t("optional")})</span>
        </label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("rejection_reason_placeholder")}
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={rejectMutation.isPending}>
          {t("cancel")}
        </Button>
        <Button
          variant="destructive"
          onClick={handleReject}
          disabled={rejectMutation.isPending}
        >
          {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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

  const [filters, setFilters] = useState({ page: 1, product_id: id });
  const [modalState, setModalState] = useState<ModalState>({ type: null });

  const { data, isLoading, error } = useProductVariants(filters);
  const toggleStatusMutation = useToggleVariantStatus();

  const variants = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);
  const productTitle = variants[0]?.product?.title;

  const handleToggleStatus = async (variant: ProductVariant) => {
    try {
      await toggleStatusMutation.mutateAsync(variant.id);
      toast.success(t("status_updated_successfully"));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t("failed_to_update_status"));
    }
  };

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

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead className="w-[80px]">{t("image")}</TableHead>
              <TableHead>{t("slug")}</TableHead>
              <TableHead>{t("price")}</TableHead>
              <TableHead>{t("stock")}</TableHead>
              <TableHead>{t("city")}</TableHead>
              <TableHead>{t("brand_model")}</TableHead>
              <TableHead>{t("year")}</TableHead>
              <TableHead>{t("approval_status")}</TableHead>
              <TableHead className="w-[80px]">{t("default")}</TableHead>
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
            ) : variants.length > 0 ? (
              variants.map((variant, index) => (
                <TableRow key={variant.id}>
                  <TableCell>{filters.page * perPage - perPage + index + 1}</TableCell>
                  <TableCell>
                    {variant.main_image ? (
                      <img
                        src={variant.main_image}
                        alt={variant.slug}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{variant.slug}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{variant.price_final} ₼</span>
                      {variant.discount > 0 && (
                        <span className="text-xs text-gray-400 line-through">{variant.price} ₼</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={variant.stock > 0 ? "default" : "destructive"}>
                      {variant.stock}
                    </Badge>
                  </TableCell>
                  <TableCell>{variant.city.title}</TableCell>
                  <TableCell>{variant.brand_model.title}</TableCell>
                  <TableCell>{variant.year}</TableCell>
                  <TableCell>
                    <ApprovalStatusBadge
                      status={variant.approval_status}
                      label={variant.approval_status_label}
                    />
                  </TableCell>
                  <TableCell>
                    {variant.is_default && (
                      <Badge variant="outline" className="text-xs">{t("default")}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={variant.is_active}
                      onCheckedChange={() => handleToggleStatus(variant)}
                      disabled={toggleStatusMutation.isPending}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link
                        to="/products/$productId/variants/$variantId"
                        params={{ productId, variantId: String(variant.id) }}
                      >
                        <Button variant="ghost" size="icon" title={t("view")}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t("history")}
                        onClick={() => setModalState({ type: "history", variant })}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      {variant.approval_status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("approve")}
                            className="text-green-600 hover:text-green-700"
                            onClick={() => setModalState({ type: "approve", variant })}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("reject")}
                            className="text-red-600 hover:text-red-700"
                            onClick={() => setModalState({ type: "reject", variant })}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={12} className="py-12 text-center text-gray-500">
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
            <div key={i} className="h-40 animate-pulse rounded-lg bg-gray-200" />
          ))
        ) : variants.length > 0 ? (
          variants.map((variant, index) => (
            <Card key={variant.id} className="p-4">
              <div className="flex items-start gap-3">
                {variant.main_image ? (
                  <img
                    src={variant.main_image}
                    alt={variant.slug}
                    className="h-16 w-16 rounded object-cover"
                  />
                ) : (
                  <ImageIcon className="h-16 w-16 text-gray-400" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {filters.page * perPage - perPage + index + 1}. {variant.slug}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <ApprovalStatusBadge
                      status={variant.approval_status}
                      label={variant.approval_status_label}
                    />
                    <Badge variant={variant.stock > 0 ? "default" : "destructive"}>
                      {t("stock")}: {variant.stock}
                    </Badge>
                    {variant.is_default && (
                      <Badge variant="outline">{t("default")}</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium">{variant.price_final} ₼</p>
                  <p className="text-xs text-gray-400">
                    {variant.city.title} · {variant.brand_model.title} · {variant.year}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <Switch
                  checked={variant.is_active}
                  onCheckedChange={() => handleToggleStatus(variant)}
                  disabled={toggleStatusMutation.isPending}
                />
                <div className="flex items-center gap-1">
                  <Link
                    to="/products/$productId/variants/$variantId"
                    params={{ productId, variantId: String(variant.id) }}
                  >
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setModalState({ type: "history", variant })}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                  {variant.approval_status === "pending" && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-green-600"
                        onClick={() => setModalState({ type: "approve", variant })}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => setModalState({ type: "reject", variant })}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <p className="py-12 text-center text-gray-500">{t("no_data_found")}</p>
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
          <HistoryModal variantId={modalState.variant.id} onClose={closeModal} />
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
          <ApproveModal variant={modalState.variant} onClose={closeModal} />
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
          <RejectModal variant={modalState.variant} onClose={closeModal} />
        )}
      </Modal>
    </div>
  );
}
