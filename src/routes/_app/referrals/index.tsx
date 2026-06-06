import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  UserCheck,
  TrendingUp,
  Wallet,
  Clock,
  AlertTriangle,
  ArrowUpCircle,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useReferralOverview, useBalanceAdjust } from "@/lib/queries/referrals";
import { useTranslation } from "@/lib/utils/translationLoader";
import { ReferralNav } from "./-components/ReferralNav";
import { UserAsyncSelect } from "./-components/UserAsyncSelect";

export const Route = createFileRoute("/_app/referrals/")({
  component: RouteComponent,
});

function StatCard({
  icon,
  label,
  value,
  sub,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  danger?: boolean;
}) {
  return (
    <Card className="p-5 flex items-start gap-4">
      <div
        className={[
          "rounded-xl p-3",
          danger ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary",
        ].join(" ")}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className={["text-2xl font-bold mt-0.5", danger ? "text-red-600" : ""].join(" ")}>
          {value}
        </p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

function RouteComponent() {
  const { t } = useTranslation();
  const { data: overview, isLoading } = useReferralOverview();
  const balanceAdjustMutation = useBalanceAdjust();

  const [adjustModal, setAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    type: "add" as "add" | "deduct",
    amount_azn: "",
    reason: "",
  });
  const [selectedUser, setSelectedUser] = useState<{ id: number; full_name: string; email: string } | null>(null);

  const handleAdjust = async () => {
    if (!selectedUser || !adjustForm.amount_azn || !adjustForm.reason) return;
    try {
      await balanceAdjustMutation.mutateAsync({
        user_id: selectedUser.id,
        type: adjustForm.type,
        amount_azn: Number(adjustForm.amount_azn),
        reason: adjustForm.reason,
      });
      toast.success(t("balance_adjusted_successfully") || "Balans yeniləndi");
      setAdjustModal(false);
      setAdjustForm({ type: "add", amount_azn: "", reason: "" });
      setSelectedUser(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("failed_to_adjust_balance") || "Xəta baş verdi");
    }
  };

  const closeAdjustModal = () => {
    setAdjustModal(false);
    setAdjustForm({ type: "add", amount_azn: "", reason: "" });
    setSelectedUser(null);
  };

  const fmt = (v: number | undefined) =>
    v !== undefined ? v.toFixed(2) + " ₼" : "—";

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">{t("referrals") || "Referrallar"}</h1>
        <Button variant="outline" size="sm" onClick={() => setAdjustModal(true)}>
          {t("balance_adjust") || "Balans düzəlişi"}
        </Button>
      </div>

      <ReferralNav />

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label={t("total_referrers") || "Ümumi referrer"}
            value={overview?.total_referrers ?? 0}
            sub={`${overview?.active_referrers ?? 0} ${t("active") || "aktiv"}`}
          />
          <StatCard
            icon={<UserCheck className="w-5 h-5" />}
            label={t("total_attributions") || "Ümumi attribution"}
            value={overview?.total_attributions ?? 0}
            sub={`${overview?.active_attributions ?? 0} ${t("active") || "aktiv"}`}
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label={t("pending_earnings") || "Gözləyən earning"}
            value={fmt(overview?.pending_earnings_azn)}
          />
          <StatCard
            icon={<Wallet className="w-5 h-5" />}
            label={t("available_earnings") || "Mövcud earning"}
            value={fmt(overview?.available_earnings_azn)}
          />
          <StatCard
            icon={<DollarSign className="w-5 h-5" />}
            label={t("total_paid") || "Ümumi ödənilmiş"}
            value={fmt(overview?.total_paid_azn)}
          />
          <StatCard
            icon={<ArrowUpCircle className="w-5 h-5" />}
            label={t("pending_withdrawals") || "Gözləyən çıxarış"}
            value={overview?.pending_withdrawals ?? 0}
            danger={(overview?.pending_withdrawals ?? 0) > 0}
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5" />}
            label={t("unresolved_fraud_flags") || "Həll edilməmiş fraud"}
            value={overview?.unresolved_fraud_flags ?? 0}
            danger={(overview?.unresolved_fraud_flags ?? 0) > 0}
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label={t("active_referrers") || "Aktiv referrer"}
            value={overview?.active_referrers ?? 0}
          />
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("withdrawals") || "Çıxarışlar", href: "/referrals/withdrawals", badge: overview?.pending_withdrawals },
          { label: t("fraud_flags") || "Fraud Flags", href: "/referrals/fraud-flags", badge: overview?.unresolved_fraud_flags },
          { label: t("codes") || "Kodlar", href: "/referrals/codes" },
          { label: t("settings") || "Tənzimləmələr", href: "/referrals/settings" },
        ].map((item) => (
          <Link key={item.href} to={item.href}>
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between">
              <span className="text-sm font-medium">{item.label}</span>
              {!!item.badge && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {/* Balance Adjust Modal */}
      <Modal
        isOpen={adjustModal}
        onClose={closeAdjustModal}
        title={t("balance_adjust") || "Manual Balans Düzəlişi"}
        size="sm"
      >
        <div className="space-y-4 p-1">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              {t("user") || "İstifadəçi"}
            </label>
            <UserAsyncSelect
              value={selectedUser}
              onChange={setSelectedUser}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              {t("type") || "Növ"}
            </label>
            <Select
              value={adjustForm.type}
              onValueChange={(v) => setAdjustForm((p) => ({ ...p, type: v as "add" | "deduct" }))}
              options={[
                { value: "add",    label: t("add")    || "Artır" },
                { value: "deduct", label: t("deduct") || "Azalt" },
              ]}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              {t("amount_azn") || "Məbləğ (AZN)"}
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={adjustForm.amount_azn}
              onChange={(e) => setAdjustForm((p) => ({ ...p, amount_azn: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              placeholder="10.00"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              {t("reason") || "Səbəb (audit)"}
            </label>
            <textarea
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm((p) => ({ ...p, reason: e.target.value }))}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
              placeholder={t("reason_placeholder") || "Texniki kompensasiya..."}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={closeAdjustModal}
            >
              {t("cancel") || "Ləğv et"}
            </Button>
            <Button
              className="flex-1"
              onClick={handleAdjust}
              disabled={
                balanceAdjustMutation.isPending ||
                !selectedUser ||
                !adjustForm.amount_azn ||
                !adjustForm.reason
              }
            >
              {balanceAdjustMutation.isPending ? t("saving") || "..." : t("save") || "Saxla"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
