import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
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
  useReferralFraudFlags,
  type FraudSeverity,
  type FraudFlag,
} from "@/lib/queries/referrals";
import { useTranslation } from "@/lib/utils/translationLoader";
import { ReferralNav } from "../-components/ReferralNav";
import Resolve from "./-popups/Resolve";

export const Route = createFileRoute("/_app/referrals/fraud-flags/")({
  component: RouteComponent,
});

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const SEVERITY_STYLES: Record<string, string> = {
  hard_block: "bg-red-100 text-red-700",
  soft_flag:  "bg-amber-100 text-amber-700",
};

const FLAG_TYPE_LABELS: Record<string, string> = {
  card:     "💳 Kart",
  phone:    "📱 Telefon",
  device:   "💻 Cihaz",
  ip:       "🌐 IP",
  velocity: "⚡ Velocity",
};

type ModalState = { type: "resolve"; data: FraudFlag } | { type: null };

function RouteComponent() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [filters, setFilters] = useState<{
    page: number;
    unresolved_only: boolean;
    severity: FraudSeverity | "";
  }>({ page: 1, unresolved_only: true, severity: "" });
  const [modal, setModal] = useState<ModalState>({ type: null });

  const { data, isLoading } = useReferralFraudFlags(filters);

  const items = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const perPage = data?.meta?.per_page ?? 20;
  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6 py-6">
      <h1 className="text-2xl font-semibold">{t("referrals") || "Referrallar"}</h1>
      <ReferralNav />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select
          value={filters.unresolved_only ? "unresolved" : "all"}
          onValueChange={(v) =>
            setFilters((p) => ({ ...p, page: 1, unresolved_only: v === "unresolved" }))
          }
          options={[
            { value: "unresolved", label: t("unresolved_only") || "Həll edilməmiş" },
            { value: "all",        label: t("all")            || "Hamısı" },
          ]}
          className="w-44"
        />
        <Select
          value={filters.severity}
          onValueChange={(v) =>
            setFilters((p) => ({ ...p, page: 1, severity: v as FraudSeverity | "" }))
          }
          options={[
            { value: "",           label: t("all")        || "Hamısı" },
            { value: "hard_block", label: "Hard Block" },
            { value: "soft_flag",  label: "Soft Flag" },
          ]}
          placeholder={t("all_severities") || "Bütün şiddətlər"}
          className="w-44"
        />
        <span className="text-sm text-gray-500">{t("total") || "Cəmi"}: {total}</span>
      </div>

      {/* Desktop table */}
      {!isMobile && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t("user") || "İstifadəçi"}</TableHead>
                <TableHead>{t("matched_with") || "Uyğun gələn"}</TableHead>
                <TableHead>{t("flag_type") || "Növ"}</TableHead>
                <TableHead>{t("severity") || "Şiddət"}</TableHead>
                <TableHead>{t("resolved") || "Həll"}</TableHead>
                <TableHead>{t("created_at") || "Tarix"}</TableHead>
                <TableHead>{t("actions") || "Əməliyyatlar"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((_, j) => (
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
                    <TableCell>
                      {item.matched_with_user ? (
                        <>
                          <div className="font-medium">{item.matched_with_user.name} {item.matched_with_user.surname}</div>
                          <div className="text-xs text-gray-500">{item.matched_with_user.email}</div>
                        </>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {FLAG_TYPE_LABELS[item.flag_type] ?? item.flag_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SEVERITY_STYLES[item.severity] ?? ""}`}>
                        {item.severity}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.resolved ? (
                        <span className="text-green-600 text-xs font-medium">
                          ✓ {t(item.resolution ?? "") || item.resolution}
                        </span>
                      ) : (
                        <span className="text-amber-600 text-xs font-medium">
                          {t("pending") || "Gözləyir"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{formatDate(item.created_at)}</TableCell>
                    <TableCell>
                      {!item.resolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-xs"
                          onClick={() => setModal({ type: "resolve", data: item })}
                        >
                          <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                          {t("resolve") || "Həll et"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-gray-500">
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
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SEVERITY_STYLES[item.severity] ?? ""}`}>
                    {item.severity}
                  </span>
                </div>
                {item.matched_with_user && (
                  <p className="text-xs text-gray-600">
                    ↔ {item.matched_with_user.name} {item.matched_with_user.surname}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm">{FLAG_TYPE_LABELS[item.flag_type] ?? item.flag_type}</span>
                  {!item.resolved && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-xs"
                      onClick={() => setModal({ type: "resolve", data: item })}
                    >
                      {t("resolve") || "Həll et"}
                    </Button>
                  )}
                  {item.resolved && (
                    <span className="text-green-600 text-xs font-medium">
                      ✓ {t(item.resolution ?? "") || item.resolution}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{formatDate(item.created_at)}</p>
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
        isOpen={modal.type === "resolve"}
        onClose={() => setModal({ type: null })}
        title={t("resolve_fraud_flag") || "Fraud Flag-i Həll Et"}
        size="sm"
      >
        {modal.type === "resolve" && (
          <Resolve id={modal.data.id} onClose={() => setModal({ type: null })} />
        )}
      </Modal>
    </div>
  );
}
