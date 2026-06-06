import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRejectWithdrawal } from "@/lib/queries/referrals";
import { useTranslation } from "@/lib/utils/translationLoader";

interface Props {
  id: number;
  onClose: () => void;
}

export default function Reject({ id, onClose }: Props) {
  const { t } = useTranslation();
  const rejectMutation = useRejectWithdrawal();
  const [note, setNote] = useState("");

  const handleSubmit = async () => {
    if (!note.trim()) return;
    try {
      await rejectMutation.mutateAsync({ id, note: note.trim() });
      toast.success(t("withdrawal_rejected") || "Çıxarış rədd edildi");
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("error_occurred") || "Xəta baş verdi");
    }
  };

  return (
    <div className="space-y-4 p-1">
      <p className="text-sm text-gray-600">
        {t("reject_withdrawal_note_hint") || "Rədd səbəbini daxil edin. Balans avtomatik geri qaytarılacaq."}
      </p>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">
          {t("admin_note") || "Admin qeydi"}
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
          placeholder={t("note_placeholder") || "Kart məlumatları uyğun gəlmir..."}
          autoFocus
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          {t("cancel") || "Ləğv et"}
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          onClick={handleSubmit}
          disabled={rejectMutation.isPending || !note.trim()}
        >
          {rejectMutation.isPending ? t("rejecting") || "..." : t("reject") || "Rədd et"}
        </Button>
      </div>
    </div>
  );
}
