import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  CommissionTiersEditor,
  rowsToTiers,
  tiersToRows,
  validateCommissionTiers,
  type CommissionTierRow,
} from "@/components/ui/commission-tiers-editor";
import {
  useGlobalCommissionTiers,
  useUpdateGlobalCommissionTiers,
} from "@/lib/queries/commission-tiers";
import { useTranslation } from "@/lib/utils/translationLoader";

export const Route = createFileRoute("/_app/commission-tiers/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const { data: tiers, isLoading } = useGlobalCommissionTiers();
  const updateMutation = useUpdateGlobalCommissionTiers();

  const [rows, setRows] = useState<CommissionTierRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tiers) {
      setRows(tiersToRows(tiers));
      setError(null);
    }
  }, [tiers]);

  const handleSave = async () => {
    const validationError = validateCommissionTiers(rows);

    if (validationError) {
      setError(validationError);
      toast.error(t(validationError));
      return;
    }

    setError(null);

    try {
      const response = await updateMutation.mutateAsync(rowsToTiers(rows));
      toast.success(response.message || t("commission_tiers_saved_successfully"));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("an_error_occurred"));
    }
  };

  return (
    <div className="flex w-full flex-col gap-5 pt-5">
      <div>
        <h1 className="text-2xl font-bold">{t("global_commission_tiers")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("global_commission_tiers_hint")}
        </p>
      </div>

      <div className="mt-5 w-full max-w-3xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 rounded-lg border p-6">
            <CommissionTiersEditor
              value={rows}
              onChange={(next) => {
                setRows(next);
                setError(null);
              }}
              error={error}
              disabled={updateMutation.isPending}
            />

            <div className="flex justify-center pt-2">
              <Button
                type="button"
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="min-w-[200px]"
              >
                {updateMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("saving")}
                  </span>
                ) : (
                  t("save")
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
