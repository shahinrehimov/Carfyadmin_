import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/utils/translationLoader";
import type { Fitment } from "@/lib/queries/products";

/**
 * A fitment rule reads as "fits this car", where a missing value means "all":
 * no brand fits every car, a brand without a model fits all of its models, and
 * an open year bound is unrestricted on that side.
 */
export function formatFitment(
  fitment: Fitment,
  t: (key: string) => string,
): string {
  const car = fitment.brand
    ? [
        fitment.brand.title,
        fitment.brand_model?.title ?? (t("all_models") || "bütün modellər"),
      ]
        .filter(Boolean)
        .join(" ")
    : t("all_brands") || "bütün markalar";

  const { year_from: from, year_to: to } = fitment;

  if (from === null && to === null) return car;
  if (from !== null && to !== null)
    return from === to ? `${car} (${from})` : `${car} (${from}–${to})`;
  if (from !== null) return `${car} (${from}+)`;

  return `${car} (–${to})`;
}

interface FitmentSummaryProps {
  fitments?: Fitment[] | null;
  isUniversal?: boolean;
  /** Renders as plain comma-separated text instead of badges. */
  inline?: boolean;
  className?: string;
}

export function FitmentSummary({
  fitments,
  isUniversal,
  inline = false,
  className,
}: FitmentSummaryProps) {
  const { t } = useTranslation();

  if (!fitments?.length) {
    return <span className={className}>—</span>;
  }

  // A universal listing turns up in every brand and model search, so it is
  // called out rather than left to read as an ordinary rule.
  if (isUniversal) {
    const label = t("universal_product") || "Universal — bütün avtomobillər";

    return inline ? (
      <span className={className}>{label}</span>
    ) : (
      <Badge variant="secondary" className={className}>
        {label}
      </Badge>
    );
  }

  if (inline) {
    return (
      <span className={className}>
        {fitments.map((f) => formatFitment(f, t)).join(", ")}
      </span>
    );
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className ?? ""}`}>
      {fitments.map((fitment, index) => (
        <Badge key={index} variant="outline" className="font-normal">
          {formatFitment(fitment, t)}
        </Badge>
      ))}
    </div>
  );
}
