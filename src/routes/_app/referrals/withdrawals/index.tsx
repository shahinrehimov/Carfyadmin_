import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle, XCircle, Banknote } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import {
  useReferralWithdrawals,
  useApproveWithdrawal,
  useMarkPaidWithdrawal,
  type WithdrawalStatus,
  type Withdrawal,
} from "@/lib/queries/referrals";
import { useTranslation } from "@/lib/utils/translationLoader";
import { ReferralNav } from "../-components/ReferralNav";
import Reject from "./-popups/Reject";

export const Route = createFileRoute("/_app/referrals/withdrawals/")({
  component: RouteComponent,
});

const formatAzn = (cents: number) => (cents / 100).toFixed(2) + " ₼";

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const STATUS_STYLES: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  paid:     "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  cancelled:"bg-gray-100 text-gray-600",
};

type ModalState =
  | { type: "reject"; data: Withdrawal }
  | { type: null };

function RouteComponent() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [filters, setFilters] = useState<{ page: number; status: WithdrawalStatus | "" }>({
    page: 1,
    status: "pending",
  });
  const [modal, setModal] = useState<ModalState>({ type: null });

  const { data, isLoading } = useReferralWithdrawals(filters);
  const approveMutation = useApproveWithdrawal();
  const markPaidMutation = useMarkPaidWithdrawal();

  const items = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const perPage = data?.meta?.per_page ?? 20;
  const totalPages = Math.ceil(total / perPage);

  const handleApprove = async (id: number) => {
    try {
      await approveMutation.mutateAsync(id);
      toast.success(t("withdrawal_approved") || "Çıxarış onaylandı");
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("error_occurred") || "Xəta baş verdi");
    }
  };

  const handleMarkPaid = async (id: number) => {
    try {
      await markPaidMutation.mutateAsync(id);
      toast.success(t("withdrawal_marked_paid") || "Ödəniş edildi işarəsi verildi");
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("error_occurred") || "Xəta baş verdi");
    }
  };

  const statusOptions = [
    { value: "", label: t("all") || "Hamısı" },
    { value: "pending",   label: t("pending")   || "Gözləyir" },
    { value: "approved",  label: t("approved")  || "Onaylandı" },
    { value: "paid",      label: t("paid")      || "Ödənildi" },
    { value: "rejected",  label: t("rejected")  || "Rədd edildi" },
    { value: "cancelled", label: t("cancelled") || "Ləğv edildi" },
  ];

  const ActionButtons = ({ item }: { item: Withdrawal }) => (
    <div className="flex gap-1 flex-wrap">
      {item.status === "pending" && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="text-green-600 border-green-300 hover:bg-green-50 h-8 px-2 text-xs"
            onClick={() => handleApprove(item.id)}
            disabled={approveMutation.isPending}
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            {t("approve") || "Onayla"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50 h-8 px-2 text-xs"
            onClick={() => setModal({ type: "reject", data: item })}
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            {t("reject") || "Rədd et"}
          </Button>
        </>
      )}
      {item.status === "approved" && (
        <Button
          size="sm"
          variant="outline"
          className="text-blue-600 border-blue-300 hover:bg-blue-50 h-8 px-2 text-xs"
          onClick={() => handleMarkPaid(item.id)}
          disabled={markPaidMutation.isPending}
        >
          <Banknote className="w-3.5 h-3.5 mr-1" />
          {t("mark_paid") || "Ödənildi"}
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6 py-6">
      <h1 className="text-2xl font-semibold">{t("referrals") || "Referrallar"}</h1>
      <ReferralNav />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select
          value={filters.status}
          onValueChange={(v) => setFilters({ page: 1, status: v as WithdrawalStatus | "" })}
          options={statusOptions}
          className="w-44"
        />
        <span className="text-sm text-gray-500">
          {t("total") || "Cəmi"}: {total}
        </span>
      </div>

      {/* Desktop table */}
      {!isMobile && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t("user") || "İstifadəçi"}</TableHead>
                <TableHead>{t("amount") || "Məbləğ"}</TableHead>
                <TableHead>{t("fee") || "Komissiya"}</TableHead>
                <TableHead>{t("net_amount") || "Xalis"}</TableHead>
                <TableHead>{t("card") || "Kart"}</TableHead>
                <TableHead>{t("status") || "Status"}</TableHead>
                <TableHead>{t("requested_at") || "Tarix"}</TableHead>
                <TableHead>{t("actions") || "Əməliyyatlar"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(9)].map((_, j) => (
                      <TableCell key={j}><div className="h-4 animate-pulse rounded bg-gray-200" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items.length > 0 ? (
                items.map((item, idx) => (
                  <TableRow key={item.id}>
                    <TableCell>{(filters.page - 1) * perPage + idx + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium">{item.user.name} {item.user.surname}</div>
                      <div className="text-xs text-gray-500">{item.user.email}</div>
                    </TableCell>
                    <TableCell className="font-medium">{formatAzn(item.amount)}</TableCell>
                    <TableCell className="text-gray-500">{formatAzn(item.fee)}</TableCell>
                    <TableCell className="font-semibold text-green-700">{formatAzn(item.net_amount)}</TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">**** {item.card_last4}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[120px]">{item.card_holder_name}</div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[item.status] ?? ""}`}>
                        {t(item.status) || item.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{formatDate(item.requested_at)}</TableCell>
                    <TableCell><ActionButtons item={item} /></TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-gray-500">
                    {t("no_data_found") || "Məlumat tapılmadı"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Mobile cards */}
      {isMobile && (
        <div className="space-y-3">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200" />
            ))
          ) : items.length > 0 ? (
            items.map((item) => (
              <Card key={item.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{item.user.name} {item.user.surname}</p>
                    <p className="text-xs text-gray-500">{item.user.email}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[item.status] ?? ""}`}>
                    {t(item.status) || item.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">{t("amount") || "Məbləğ"}</p>
                    <p className="font-medium">{formatAzn(item.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t("fee") || "Komissiya"}</p>
                    <p>{formatAzn(item.fee)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t("net_amount") || "Xalis"}</p>
                    <p className="font-semibold text-green-700">{formatAzn(item.net_amount)}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  **** {item.card_last4} · {item.card_holder_name} · {formatDate(item.requested_at)}
                </div>
                <ActionButtons item={item} />
              </Card>
            ))
          ) : (
            <div className="py-10 text-center text-gray-500">{t("no_data_found") || "Məlumat tapılmadı"}</div>
          )}
        </div>
      )}

      <Pagination
        currentPage={filters.page}
        totalPages={totalPages}
        pageSize={perPage}
        totalItems={total}
        onPageChange={(page) => setFilters((p) => ({ ...p, page }))}
        onPageSizeChange={() => {}}
        disabled={isLoading}
      />

      <Modal
        isOpen={modal.type === "reject"}
        onClose={() => setModal({ type: null })}
        title={t("reject_withdrawal") || "Çıxarışı Rədd Et"}
        size="sm"
      >
        {modal.type === "reject" && (
          <Reject id={modal.data.id} onClose={() => setModal({ type: null })} />
        )}
      </Modal>
    </div>
  );
}
