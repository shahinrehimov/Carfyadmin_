export interface FitmentSelection {
  brand: { id: number; title: string } | null;
  brand_model: { id: number; title: string } | null;
}

export function fitmentSelectionLabel(
  selection?: FitmentSelection | null,
): string {
  if (!selection?.brand?.title) return "";
  return selection.brand_model?.title
    ? `${selection.brand.title} ${selection.brand_model.title}`
    : selection.brand.title;
}

export function FitmentSelectionBadge({
  selection,
}: {
  selection?: FitmentSelection | null;
}) {
  const label = fitmentSelectionLabel(selection);
  if (!label) return null;

  return (
    <span className="mt-1 inline-flex w-fit items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
      🚗 {label} üçün
    </span>
  );
}
