import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Modal from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOrders, type Order, type OrdersFilters } from "@/lib/queries/orders";
import { useTranslation } from "@/lib/utils/translationLoader";
import Show from "./-popups/Show";

export const Route = createFileRoute("/_app/orders/")({
  component: RouteComponent,
});

const STATUS_OPTIONS = [
  "pending",
  "payment_pending",
  "processing",
  "confirmed",
  "shipped",
  "ready_for_delivery",
  "courier_assigned",
  "delivered",
  "canceled",
  "failed",
];

const PAYMENT_STATUS_OPTIONS = ["pending", "paid", "failed", "refunded", "partial_refund"];

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

function RouteComponent() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<OrdersFilters>({ page: 1 });
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const { data, isLoading } = useOrders(filters);

  const orders = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);

  const setFilter = <K extends keyof OrdersFilters>(key: K, value: OrdersFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const statusOptions = [
    { value: "all", label: t("all") },
    ...STATUS_OPTIONS.map((s) => ({ value: s, label: s })),
  ];

  const paymentStatusOptions = [
    { value: "all", label: t("all") },
    ...PAYMENT_STATUS_OPTIONS.map((s) => ({ value: s, label: s })),
  ];

  return (
    <div className="space-y-6 py-6">
      <h1 className="text-2xl font-semibold">{t("orders")}</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder={t("search")}
          value={filters.search ?? ""}
          onChange={(e) => setFilter("search", e.target.value)}
        />
        <Input
          placeholder={t("code")}
          value={filters.code ?? ""}
          onChange={(e) => setFilter("code", e.target.value)}
        />
        <Select
          value={filters.status || "all"}
          onValueChange={(v) => setFilter("status", v === "all" ? "" : v)}
          options={statusOptions}
          placeholder={t("status")}
        />
        <Select
          value={filters.payment_status || "all"}
          onValueChange={(v) => setFilter("payment_status", v === "all" ? "" : v)}
          options={paymentStatusOptions}
          placeholder={t("payment_status")}
        />
        <Input
          type="date"
          value={filters.date_from ?? ""}
          onChange={(e) => setFilter("date_from", e.target.value)}
          placeholder={t("date_from")}
        />
        <Input
          type="date"
          value={filters.date_to ?? ""}
          onChange={(e) => setFilter("date_to", e.target.value)}
          placeholder={t("date_to")}
        />
        <Input
          placeholder={t("amount_min")}
          value={filters.amount_min ?? ""}
          onChange={(e) => setFilter("amount_min", e.target.value)}
          type="number"
        />
        <Input
          placeholder={t("amount_max")}
          value={filters.amount_max ?? ""}
          onChange={(e) => setFilter("amount_max", e.target.value)}
          type="number"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>{t("code")}</TableHead>
            <TableHead>{t("user")}</TableHead>
            <TableHead>{t("address")}</TableHead>
            <TableHead>{t("amount")}</TableHead>
            <TableHead>{t("shipping")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("payment_status")}</TableHead>
            <TableHead>{t("created_date")}</TableHead>
            <TableHead>{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [...Array(8)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(10)].map((_, j) => (
                  <TableCell key={j}>
                    <div className="h-4 animate-pulse rounded bg-gray-200" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : orders.length > 0 ? (
            orders.map((order: Order, index: number) => (
              <TableRow key={order.id}>
                <TableCell>{(filters.page - 1) * perPage + index + 1}</TableCell>
                <TableCell>
                  <span className="font-mono text-xs font-medium">{order.code}</span>
                </TableCell>
                <TableCell>
                  {order.user ? (
                    <div className="text-sm">
                      <p className="font-medium">{order.user.full_name}</p>
                      <p className="text-xs text-gray-500">{order.user.email}</p>
                      {order.user.phone && (
                        <p className="text-xs text-gray-500">{order.user.phone}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{order.address?.address_line_1}</p>
                    <p className="text-xs text-gray-500">
                      {order.address?.city?.title}
                      {order.address?.phone ? ` · ${order.address.phone}` : ""}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p className="font-medium">{order.amount_final} ₼</p>
                    {order.total_discount_in_basket > 0 && (
                      <p className="text-xs text-gray-400 line-through">{order.amount} ₼</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">{order.shipping} ₼</TableCell>
                <TableCell>
                  <StatusBadge status={order.status} label={order.status_label} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={order.payment_status} label={order.payment_status_label} />
                </TableCell>
                <TableCell className="text-sm text-gray-600">{order.created_at}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={10} className="py-12 text-center text-gray-500">
                {t("no_data_found")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Pagination
        currentPage={filters.page}
        totalPages={totalPages}
        pageSize={perPage}
        totalItems={total}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        onPageSizeChange={() => {}}
        disabled={isLoading}
      />

      <Modal
        isOpen={selectedOrderId !== null}
        onClose={() => setSelectedOrderId(null)}
        title={t("order_details")}
        size="xl"
      >
        {selectedOrderId !== null && (
          <Show orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
        )}
      </Modal>
    </div>
  );
}
