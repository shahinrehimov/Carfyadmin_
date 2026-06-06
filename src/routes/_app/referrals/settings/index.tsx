import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useReferralSettings, useUpdateSettings } from "@/lib/queries/referrals";
import { useTranslation } from "@/lib/utils/translationLoader";
import { ReferralNav } from "../-components/ReferralNav";

export const Route = createFileRoute("/_app/referrals/settings/")({
  component: RouteComponent,
});

const SETTING_META: Record<string, { label: string; description: string; suffix?: string }> = {
  referral_pending_days:           { label: "Pending gün sayı",              description: "Earning-in pending → available-ə keçmə günü",               suffix: "gün" },
  referral_withdrawal_fee_percent: { label: "Çıxarış komissiyası",           description: "Çıxarış komissiyası faizi",                                   suffix: "%" },
  referral_min_platform_spend:     { label: "Min. platforma xərcləməsi",     description: "Attribution aktivləşmə üçün min xərc (sent). 2000 = 20 AZN",  suffix: "sent" },
  referral_min_withdrawal:         { label: "Min. çıxarış",                  description: "Çıxarış üçün minimum balans (sent). 5000 = 50 AZN",            suffix: "sent" },
  referral_activation_threshold:   { label: "Aktivləşmə həddi",              description: "Attribution-un aktiv olması üçün min sifariş (sent)",          suffix: "sent" },
  referral_code_min_length:        { label: "Kod min. uzunluq",              description: "Referral kodunun minimum simvol sayı",                         suffix: "simvol" },
  referral_code_max_length:        { label: "Kod max. uzunluq",              description: "Referral kodunun maksimum simvol sayı",                        suffix: "simvol" },
  referral_activity_window_days:   { label: "Aktivlik pəncərəsi",            description: "Aktiv/passiv yoxlama dövrü",                                   suffix: "gün" },
  referral_activity_min_orders:    { label: "Min. sifariş (aktiv qalmaq)",   description: "Aktiv qalmaq üçün pəncərədə min sifariş sayı",                 suffix: "sifariş" },
  referral_activity_min_referrals: { label: "Min. dəvət (aktiv qalmaq)",     description: "Aktiv qalmaq üçün pəncərədə min yeni dəvət sayı",              suffix: "dəvət" },
};

function RouteComponent() {
  const { t } = useTranslation();
  const { data: settings, isLoading } = useReferralSettings();
  const updateMutation = useUpdateSettings();

  const [values, setValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {};
      settings.forEach((s) => { map[s.key] = s.value; });
      setValues(map);
      setDirty(false);
    }
  }, [settings]);

  const handleChange = (key: string, val: string) => {
    setValues((p) => ({ ...p, [key]: val }));
    setDirty(true);
  };

  const handleSave = async () => {
    const changed = Object.entries(values)
      .filter(([key, val]) => {
        const original = settings?.find((s) => s.key === key)?.value;
        return original !== val;
      })
      .map(([key, value]) => ({ key, value }));

    if (!changed.length) {
      toast.info(t("no_changes") || "Dəyişiklik yoxdur");
      return;
    }

    try {
      await updateMutation.mutateAsync(changed);
      toast.success(t("settings_saved") || "Tənzimləmələr saxlanıldı");
      setDirty(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("error_occurred") || "Xəta baş verdi");
    }
  };

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">{t("referrals") || "Referrallar"}</h1>
        <Button onClick={handleSave} disabled={updateMutation.isPending || !dirty} className="gap-2">
          <Save className="w-4 h-4" />
          {updateMutation.isPending ? (t("saving") || "Saxlanılır...") : (t("save_settings") || "Saxla")}
        </Button>
      </div>

      <ReferralNav />

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(SETTING_META).map((key) => {
            const meta = SETTING_META[key];
            const val = values[key] ?? "";
            return (
              <Card key={key} className="p-4 space-y-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{meta.label}</p>
                  <p className="text-xs text-gray-500">{meta.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={val}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary min-w-0"
                    min={0}
                  />
                  {meta.suffix && (
                    <span className="text-xs text-gray-400 shrink-0">{meta.suffix}</span>
                  )}
                </div>
                <p className="text-xs font-mono text-gray-400">{key}</p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
