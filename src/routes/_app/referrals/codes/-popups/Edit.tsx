import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useUpdateCode } from "@/lib/queries/referrals";
import { useTranslation } from "@/lib/utils/translationLoader";

interface Props {
  id: number;
  currentCode: string;
  onClose: () => void;
}

export default function Edit({ id, currentCode, onClose }: Props) {
  const { t } = useTranslation();
  const updateMutation = useUpdateCode();
  const [code, setCode] = useState(currentCode);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setError("");
    try {
      await updateMutation.mutateAsync({ id, code: code.trim() });
      toast.success(t("code_updated_successfully") || "Kod yeniləndi");
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || t("error_occurred") || "Xəta baş verdi");
    }
  };

  return (
    <div className="space-y-4 p-1">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">
          {t("referral_code") || "Referral kodu"}
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) =>
            setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
          }
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono tracking-widest uppercase focus:outline-none focus:border-primary"
          maxLength={20}
          autoFocus
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        <p className="text-xs text-gray-400 mt-1">
          {t("code_change_warning") || "⚠ Köhnə kod artıq işləməyəcək. Paylaşılmış linklər sınacaq."}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          {t("cancel") || "Ləğv et"}
        </Button>
        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={updateMutation.isPending || !code.trim() || code === currentCode}
        >
          {updateMutation.isPending ? t("saving") || "..." : t("save") || "Saxla"}
        </Button>
      </div>
    </div>
  );
}
