import { useState } from "react";
import { toast } from "sonner";
import {
  Package,
  MapPin,
  CreditCard,
  Truck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Store,
  Receipt,
  Clock,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useOrder,
  useChangeOrderStatus,
  useUpdatePaymentStatus,
  useRefundOrder,
  useSetFinalStatus,
  useAssignCourier,
  useRequestWoltDelivery,
  type StatusTreeItem,
  type SellerGroup,
  type OrderCompany,
} from "@/lib/queries/orders";
import { useTranslation } from "@/lib/utils/translationLoader";

interface ShowProps {
  orderId: number;
  onClose: () => void;
}

const statusColorMap: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  payment_pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  confirmed: "bg-cyan-100 text-cyan-700",
  shipped: "bg-indigo-100 text-indigo-700",
  ready_for_delivery: "bg-purple-100 text-purple-700",
  courier_assigned: "bg-violet-100 text-violet-700",
  delivered: "bg-green-100 text-green-700",
  canceled: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
  paid: "bg-green-100 text-green-700",
  refunded: "bg-orange-100 text-orange-700",
  partial_refund: "bg-amber-100 text-amber-700",
};

function StatusBadge({ status, label }: { status: string; label?: string }) {
  const cls = statusColorMap[status] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label ?? status}
    </span>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b pb-2">
      <span className="text-gray-400">{icon}</span>
      <h3 className="font-semibold">{title}</h3>
    </div>
  );
}

function AccordionSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
        onClick={() => setOpen((p) => !p)}
      >
        <span className="flex items-center gap-2">
          <span className="text-gray-500">{icon}</span>
          {title}
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {open && <div className="border-t px-4 py-3">{children}</div>}
    </div>
  );
}

function StatusTree({ items }: { items: StatusTreeItem[] }) {
  return (
    <div className="flex items-center gap-1">
      {items.map((item, i) => (
        <div key={item.status} className="flex items-center gap-1">
          <div className="flex flex-col items-center gap-0.5">
            {item.is_checked ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4 text-gray-300" />
            )}
            <span className={`text-[10px] ${item.is_checked ? "text-green-600 font-medium" : "text-gray-400"}`}>
              {item.status_label}
            </span>
            {item.date && <span className="text-[9px] text-gray-400">{item.date}</span>}
          </div>
          {i < items.length - 1 && (
            <div className={`mb-4 h-px w-6 ${item.is_checked ? "bg-green-400" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Show({ orderId, onClose }: ShowProps) {
  const { t } = useTranslation();
  const { data: order, isLoading } = useOrder(orderId);

  const [newStatus, setNewStatus] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] = useState("");
  const [finalStatus, setFinalStatus] = useState("");
  const [finalCancelReason, setFinalCancelReason] = useState("");
  const [courierName, setCourierName] = useState("");
  const [courierPhone, setCourierPhone] = useState("");
  const [courierEta, setCourierEta] = useState("");
  const [courierNotes, setCourierNotes] = useState("");
  const [pendingWoltCompanyId, setPendingWoltCompanyId] = useState<number | null>(null);

  const changeStatusMutation = useChangeOrderStatus();
  const updatePaymentMutation = useUpdatePaymentStatus();
  const refundMutation = useRefundOrder();
  const setFinalStatusMutation = useSetFinalStatus();
  const assignCourierMutation = useAssignCourier();
  const requestWoltMutation = useRequestWoltDelivery();

  const handleChangeStatus = async () => {
    if (!newStatus) return;
    try {
      const res = await changeStatusMutation.mutateAsync({
        id: orderId,
        data: { status: newStatus, cancel_reason: cancelReason || null },
      });
      toast.success(res.message || t("status_updated_successfully"));
      setNewStatus("");
      setCancelReason("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const handleUpdatePayment = async () => {
    if (!newPaymentStatus) return;
    try {
      const res = await updatePaymentMutation.mutateAsync({
        id: orderId,
        data: { status: newPaymentStatus },
      });
      toast.success(res.message || t("status_updated_successfully"));
      setNewPaymentStatus("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const handleRefund = async () => {
    try {
      const res = await refundMutation.mutateAsync({
        id: orderId,
        data: { status: "pending" },
      });
      toast.success(res.message || t("refund_initiated_successfully"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const handleSetFinalStatus = async () => {
    if (!finalStatus) return;
    try {
      const res = await setFinalStatusMutation.mutateAsync({
        id: orderId,
        data: { status: finalStatus, cancel_reason: finalCancelReason || null },
      });
      toast.success(res.message || t("status_updated_successfully"));
      setFinalStatus("");
      setFinalCancelReason("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const handleAssignCourier = async () => {
    if (!courierName || !courierPhone) return;
    try {
      const res = await assignCourierMutation.mutateAsync({
        id: orderId,
        data: {
          courier_info: { name: courierName, phone: courierPhone, eta: courierEta, notes: courierNotes },
        },
      });
      toast.success(res.message || t("courier_assigned_successfully"));
      setCourierName("");
      setCourierPhone("");
      setCourierEta("");
      setCourierNotes("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const handleWoltDelivery = async (companyId: number) => {
    setPendingWoltCompanyId(companyId);
    try {
      const res = await requestWoltMutation.mutateAsync({
        id: orderId,
        data: { company_id: companyId },
      });
      toast.success(res.message || t("wolt_delivery_requested_successfully"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    } finally {
      setPendingWoltCompanyId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-6 animate-pulse rounded bg-gray-200" />
        ))}
      </div>
    );
  }

  if (!order) return null;

  const ORDER_STATUSES = [
    "pending", "payment_pending", "processing", "confirmed",
    "shipped", "ready_for_delivery", "courier_assigned", "delivered", "canceled",
  ];
  const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded", "partial_refund"];
  const FINAL_STATUSES = ["courier_assigned", "canceled"];

  return (
    <div className="space-y-5 py-2">

      {/* ── Order info ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <SectionTitle icon={<Package className="h-4 w-4" />} title={t("order_info")} />
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-gray-500">{t("code")}</p>
            <p className="font-mono font-semibold">{order.code}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t("amount")}</p>
            <p className="font-semibold">{order.amount_final} ₼</p>
            {order.total_discount_in_basket > 0 && (
              <p className="text-xs text-gray-400 line-through">{order.amount} ₼</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500">{t("shipping")}</p>
            <p className="font-medium">{order.shipping} ₼</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t("status")}</p>
            <StatusBadge status={order.status} label={order.status_label} />
          </div>
          <div>
            <p className="text-xs text-gray-500">{t("payment_status")}</p>
            <StatusBadge status={order.payment_status} label={order.payment_status_label} />
          </div>
          <div>
            <p className="text-xs text-gray-500">{t("payment_method")}</p>
            <p className="font-medium">{order.payment_method_display ?? order.payment_method}</p>
          </div>
          {order.transaction_id && (
            <div className="col-span-2 sm:col-span-3">
              <p className="text-xs text-gray-500">{t("transaction_id")}</p>
              <p className="break-all font-mono text-xs">{order.transaction_id}</p>
            </div>
          )}
          {order.cancel_reason && (
            <div className="col-span-2 sm:col-span-3">
              <p className="text-xs text-gray-500">{t("cancel_reason")}</p>
              <p className="font-medium text-red-600">{order.cancel_reason}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500">{t("created_date")}</p>
            <p className="text-sm">{order.created_at}</p>
          </div>
          {order.paid_at && (
            <div>
              <p className="text-xs text-gray-500">{t("paid_at")}</p>
              <p className="text-sm">{order.paid_at}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Status tree ────────────────────────────────────────────── */}
      {order.status_tree?.length > 0 && (
        <div className="space-y-2">
          <SectionTitle icon={<CheckCircle2 className="h-4 w-4" />} title={t("status_progress")} />
          <div className="overflow-x-auto py-1">
            <StatusTree items={order.status_tree} />
          </div>
        </div>
      )}

      {/* ── Address ────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <SectionTitle icon={<MapPin className="h-4 w-4" />} title={t("shipping_address")} />
        <div className="text-sm">
          <p className="font-medium">{order.address?.address_line_1}</p>
          {order.address?.address_line_2 && (
            <p className="text-gray-500">{order.address.address_line_2}</p>
          )}
          <p className="text-gray-500">{order.address?.city?.title}</p>
          <p className="text-gray-500">{order.address?.phone}</p>
        </div>
      </div>

      {/* ── Courier info ───────────────────────────────────────────── */}
      {order.courier_info && (
        <div className="space-y-2">
          <SectionTitle icon={<Truck className="h-4 w-4" />} title={t("courier_info")} />
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-gray-500">{t("name")}</p>
              <p className="font-medium">{order.courier_info.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t("phone")}</p>
              <p className="font-medium">{order.courier_info.phone}</p>
            </div>
            {order.courier_info.eta && (
              <div>
                <p className="text-xs text-gray-500">{t("eta")}</p>
                <p>{order.courier_info.eta}</p>
              </div>
            )}
            {order.courier_info.notes && (
              <div>
                <p className="text-xs text-gray-500">{t("notes")}</p>
                <p>{order.courier_info.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Items by seller ────────────────────────────────────────── */}
      {order.items_by_seller?.length > 0 && (
        <div className="space-y-2">
          <SectionTitle icon={<Store className="h-4 w-4" />} title={t("order_items")} />
          <div className="space-y-3">
            {order.items_by_seller.map((group: SellerGroup) => (
              <div key={group.company_id} className="rounded-lg border">
                <div className="bg-gray-50 px-3 py-2 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {group.company_name ?? group.store_code}
                    </span>
                    {(() => {
                      const shipping = order.shipping_per_seller?.find((s) => s.company_id === group.company_id);
                      return shipping ? (
                        <span className="text-xs text-gray-500">
                          {t("shipping")}: {shipping.amount} ₼
                        </span>
                      ) : null;
                    })()}
                  </div>
                  {(() => {
                    const shipping = order.shipping_per_seller?.find((s) => s.company_id === group.company_id);
                    if (!shipping?.wolt_deliveries?.length) return null;
                    return (
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {shipping.wolt_deliveries.map((d, i) => (
                          <a
                            key={i}
                            href={d.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300"
                          >
                            <Truck className="h-3 w-3" />
                            Wolt #{i + 1}
                            {shipping.wolt_deliveries!.length > 1 && ` · ${d.status}`}
                          </a>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("product")}</TableHead>
                      <TableHead className="w-16 text-right">{t("quantity")}</TableHead>
                      <TableHead className="w-24 text-right">{t("amount")}</TableHead>
                      <TableHead className="w-28">{t("status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">{item.product_title}</TableCell>
                        <TableCell className="text-right text-sm">{item.quantity}</TableCell>
                        <TableCell className="text-right font-medium">{item.amount_final} ₼</TableCell>
                        <TableCell>
                          <StatusBadge status={item.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Status history ─────────────────────────────────────────── */}
      {order.statuses?.length > 0 && (
        <AccordionSection icon={<Clock className="h-4 w-4" />} title={t("status_history")}>
          <div className="space-y-2">
            {order.statuses.map((s) => (
              <div key={s.id} className="flex items-start justify-between text-sm">
                <div>
                  <StatusBadge status={s.status} label={s.status_label} />
                  <p className="mt-0.5 text-xs text-gray-400">{s.created_user}</p>
                </div>
                <span className="text-xs text-gray-400">{s.created_at}</span>
              </div>
            ))}
          </div>
        </AccordionSection>
      )}

      {/* ── Payment logs ───────────────────────────────────────────── */}
      {order.payment_logs?.length > 0 && (
        <AccordionSection icon={<Receipt className="h-4 w-4" />} title={t("payment_logs")}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("action")}</TableHead>
                <TableHead>{t("payment_method")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("created_date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.payment_logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm font-medium">{log.action}</TableCell>
                  <TableCell className="text-sm">{log.payment_method}</TableCell>
                  <TableCell>
                    <StatusBadge status={log.status} />
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{log.created_at}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AccordionSection>
      )}

      {/* ── Actions ────────────────────────────────────────────────── */}
      <div className="space-y-2 border-t pt-4">
        <h3 className="font-semibold">{t("actions")}</h3>

        <AccordionSection icon={<RefreshCw className="h-4 w-4" />} title={t("change_status")}>
          <div className="space-y-2">
            <Select
              value={newStatus || ""}
              onValueChange={setNewStatus}
              options={ORDER_STATUSES.map((s) => ({ value: s, label: s }))}
              placeholder={t("select_status")}
            />
            <Input
              placeholder={t("cancel_reason")}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <Button size="sm" onClick={handleChangeStatus} disabled={!newStatus || changeStatusMutation.isPending}>
              {t("save")}
            </Button>
          </div>
        </AccordionSection>

        <AccordionSection icon={<CreditCard className="h-4 w-4" />} title={t("update_payment_status")}>
          <div className="space-y-2">
            <Select
              value={newPaymentStatus || ""}
              onValueChange={setNewPaymentStatus}
              options={PAYMENT_STATUSES.map((s) => ({ value: s, label: s }))}
              placeholder={t("select_status")}
            />
            <Button size="sm" onClick={handleUpdatePayment} disabled={!newPaymentStatus || updatePaymentMutation.isPending}>
              {t("save")}
            </Button>
          </div>
        </AccordionSection>

        <AccordionSection icon={<CheckCircle2 className="h-4 w-4" />} title={t("set_final_status")}>
          <div className="space-y-2">
            <Select
              value={finalStatus || ""}
              onValueChange={setFinalStatus}
              options={FINAL_STATUSES.map((s) => ({ value: s, label: s }))}
              placeholder={t("select_status")}
            />
            <Input
              placeholder={t("cancel_reason")}
              value={finalCancelReason}
              onChange={(e) => setFinalCancelReason(e.target.value)}
            />
            <Button size="sm" onClick={handleSetFinalStatus} disabled={!finalStatus || setFinalStatusMutation.isPending}>
              {t("save")}
            </Button>
          </div>
        </AccordionSection>

        <AccordionSection icon={<Truck className="h-4 w-4" />} title={t("assign_courier")}>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder={t("name")} value={courierName} onChange={(e) => setCourierName(e.target.value)} />
            <Input placeholder={t("phone")} value={courierPhone} onChange={(e) => setCourierPhone(e.target.value)} />
            <Input placeholder={t("eta")} value={courierEta} onChange={(e) => setCourierEta(e.target.value)} />
            <Input placeholder={t("notes")} value={courierNotes} onChange={(e) => setCourierNotes(e.target.value)} />
            <div className="col-span-2">
              <Button size="sm" onClick={handleAssignCourier} disabled={!courierName || !courierPhone || assignCourierMutation.isPending}>
                {t("save")}
              </Button>
            </div>
          </div>
        </AccordionSection>

        <AccordionSection icon={<Truck className="h-4 w-4 text-blue-500" />} title={t("request_wolt_delivery")}>
          <div className="space-y-2">
            {(order.companies ?? []).map((c: OrderCompany) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">
                    {c.title ? `${c.title} · ${c.store_code}` : c.store_code}
                  </p>
                  {c.wolt_status && (
                    <span className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColorMap[c.wolt_status] ?? "bg-gray-100 text-gray-700"}`}>
                      {c.wolt_status}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pendingWoltCompanyId === c.id}
                  onClick={() => handleWoltDelivery(c.id)}
                >
                  {t("request")}
                </Button>
              </div>
            ))}
          </div>
        </AccordionSection>

        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-medium">
            <XCircle className="h-4 w-4 text-orange-500" />
            {t("refund")}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefund}
            disabled={refundMutation.isPending}
            className="text-orange-600 hover:text-orange-700"
          >
            {t("initiate_refund")}
          </Button>
        </div>
      </div>

      <div className="flex justify-end border-t pt-4">
        <Button variant="outline" onClick={onClose}>
          {t("close")}
        </Button>
      </div>
    </div>
  );
}
