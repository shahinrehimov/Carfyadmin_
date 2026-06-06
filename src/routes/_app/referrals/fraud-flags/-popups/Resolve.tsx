import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useResolveFraudFlag, type FraudResolution } from "@/lib/queries/referrals";
import { useTranslation } from "@/lib/utils/translationLoader";

interface Props {
  id: number;
  onClose: () => void;
}

export default function Resolve({ id, onClose }: Props) {
  const { t } = useTranslation();
  const resolveMutation = useResolveFraudFlag();

  const handleResolve = async (resolution: FraudResolution) => {
    try {
      await resolveMutation.mutateAsync({ id, resolution });
      toast.success(
        resolution === "approved"
          ? t("fraud_flag_approved") || "Flag onaylandı — earning-lər balansa keçdi"
          : t("fraud_flag_rejected") || "Flag rədd edildi — earning-lər ləğv edildi"
      );
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("error_occurred") || "Xəta baş verdi");
    }
  };

  return (
    <div className="space-y-4 p-1">
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 space-y-1">
        <p>
          <strong>{t("approve") || "Onayla"}:</strong>{" "}
          {t("fraud_approve_desc") || "Flag həll edilir. fraud_hold statuslu earning-lər referrer-in balansına keçir."}
        </p>
        <p className="pt-1">
          <strong>{t("reject") || "Rədd et"}:</strong>{" "}
          {t("fraud_reject_desc") || "Flag həll edilir. fraud_hold earning-lər ləğv edilir. Attribution fraud_blocked olur."}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          onClick={() => handleResolve("approved")}
          disabled={resolveMutation.isPending}
        >
          {t("approve") || "Onayla"}
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          onClick={() => handleResolve("rejected")}
          disabled={resolveMutation.isPending}
        >
          {t("reject") || "Rədd et"}
        </Button>
      </div>
      <Button variant="outline" className="w-full" onClick={onClose}>
        {t("cancel") || "Ləğv et"}
      </Button>
    </div>
  );
}
