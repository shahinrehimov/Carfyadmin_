import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/utils/translationLoader";

/** A tier as the API sends and expects it. Amounts are in manats. */
export interface CommissionTier {
  id?: number;
  min_amount: number;
  max_amount: number | null;
  percent: number;
}

/** A tier while it is being edited — inputs are strings, max may be empty. */
export interface CommissionTierRow {
  min_amount: string;
  max_amount: string;
  percent: string;
}

export function tiersToRows(
  tiers: Array<CommissionTier> | null | undefined,
): Array<CommissionTierRow> {
  return (tiers ?? []).map((tier) => ({
    min_amount: String(tier.min_amount),
    max_amount: tier.max_amount === null ? "" : String(tier.max_amount),
    percent: String(tier.percent),
  }));
}

export function rowsToTiers(
  rows: Array<CommissionTierRow>,
): Array<CommissionTier> {
  return rows.map((row) => ({
    min_amount: Number(row.min_amount),
    max_amount: row.max_amount === "" ? null : Number(row.max_amount),
    percent: Number(row.percent),
  }));
}

/**
 * Mirrors the backend CommissionTiersRule so the admin sees the problem before
 * saving. Returns a translation key, or null when the set is valid. Gaps
 * between tiers are fine — an uncovered amount falls back to the flat rate.
 */
export function validateCommissionTiers(
  rows: Array<CommissionTierRow>,
): string | null {
  if (rows.length === 0) {
    return null;
  }

  for (const row of rows) {
    const minFilled = row.min_amount !== "";
    const percentFilled = row.percent !== "";

    if (!minFilled || !percentFilled) {
      return "commission_tier_fields_required";
    }

    if (Number(row.min_amount) < 0 || Number.isNaN(Number(row.min_amount))) {
      return "commission_tier_fields_required";
    }

    const percent = Number(row.percent);

    if (Number.isNaN(percent) || percent < 0 || percent > 100) {
      return "commission_tier_percent_out_of_range";
    }
  }

  const sorted = [...rows].sort(
    (a, b) => Number(a.min_amount) - Number(b.min_amount),
  );

  for (let index = 0; index < sorted.length; index++) {
    const current = sorted[index]!;
    const min = Number(current.min_amount);
    const max = current.max_amount === "" ? null : Number(current.max_amount);

    if (max !== null && max <= min) {
      return "commission_tier_max_must_exceed_min";
    }

    const next = sorted[index + 1];

    if (!next) {
      continue;
    }

    if (max === null) {
      return "commission_tier_open_ended_must_be_last";
    }

    if (Number(next.min_amount) < max) {
      return "commission_tiers_must_not_overlap";
    }
  }

  return null;
}

interface CommissionTiersEditorProps {
  value: Array<CommissionTierRow>;
  onChange: (rows: Array<CommissionTierRow>) => void;
  /** Translation key of a validation error to show under the rows. */
  error?: string | null;
  disabled?: boolean;
}

/**
 * Edits an amount-tiered commission rate, e.g. 0-100 => 5%, 100-150 => 6%.
 * An empty set means the flat percent above it applies instead.
 */
export function CommissionTiersEditor({
  value,
  onChange,
  error,
  disabled,
}: CommissionTiersEditorProps) {
  const { t } = useTranslation();

  const updateRow = (
    index: number,
    field: keyof CommissionTierRow,
    fieldValue: string,
  ) => {
    onChange(
      value.map((row, i) =>
        i === index ? { ...row, [field]: fieldValue } : row,
      ),
    );
  };

  const addRow = () => {
    const last = value[value.length - 1];

    // Start the new tier where the previous one ended, which is what an
    // uninterrupted ladder needs anyway.
    onChange([
      ...value,
      {
        min_amount: last?.max_amount ?? "0",
        max_amount: "",
        percent: "",
      },
    ]);
  };

  const removeRow = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <Label>{t("commission_tiers")}</Label>
          <p className="text-muted-foreground mt-1 text-xs">
            {t("commission_tiers_hint")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={disabled}
          className="flex h-auto min-h-8 w-full shrink-0 items-center justify-center gap-2 whitespace-normal sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          {t("add_tier")}
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed px-3 py-4 text-center text-sm">
          {t("no_commission_tiers")}
        </p>
      ) : (
        <div className="space-y-3 sm:space-y-2">
          <div className="text-muted-foreground hidden grid-cols-[1fr_1fr_1fr_40px] gap-2 text-xs sm:grid">
            <span>{t("tier_min_amount")}</span>
            <span>{t("tier_max_amount")}</span>
            <span>{t("tier_percent")}</span>
            <span />
          </div>

          {value.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-2 rounded-md border p-3 sm:grid-cols-[1fr_1fr_1fr_40px] sm:items-center sm:rounded-none sm:border-0 sm:p-0"
            >
              <div className="min-w-0 space-y-1">
                <span className="text-muted-foreground text-xs sm:hidden">
                  {t("tier_min_amount")}
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.min_amount}
                  onChange={(e) => updateRow(index, "min_amount", e.target.value)}
                  placeholder="0"
                  disabled={disabled}
                />
              </div>
              <div className="min-w-0 space-y-1">
                <span className="text-muted-foreground text-xs sm:hidden">
                  {t("tier_max_amount")}
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.max_amount}
                  onChange={(e) => updateRow(index, "max_amount", e.target.value)}
                  placeholder={t("tier_max_empty")}
                  disabled={disabled}
                />
              </div>
              <div className="min-w-0 space-y-1">
                <span className="text-muted-foreground text-xs sm:hidden">
                  {t("tier_percent")}
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={row.percent}
                  onChange={(e) => updateRow(index, "percent", e.target.value)}
                  placeholder="0"
                  disabled={disabled}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeRow(index)}
                disabled={disabled}
                className="text-destructive hover:text-destructive h-9 w-full px-2 sm:w-auto"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <p className="text-muted-foreground text-xs">
            {t("tier_max_empty_hint")}
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{t(error)}</p>}
    </div>
  );
}

export default CommissionTiersEditor;
