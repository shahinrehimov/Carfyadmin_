import { useTranslation } from "@/lib/utils/translationLoader";
import type { ProductBrand } from "@/lib/queries/products";

interface ProductBrandsProps {
  brands?: ProductBrand[] | null;
  isUniversal?: boolean;
  className?: string;
}

/**
 * A product's car brands now come from its variants' fitment rules, so there can
 * be several — or none at all when the product fits every car. An empty list is
 * spelled out rather than left blank, which would read as missing data.
 */
export function ProductBrands({
  brands,
  isUniversal,
  className,
}: ProductBrandsProps) {
  const { t } = useTranslation();

  if (isUniversal) {
    return (
      <span className={className}>
        {t("all_brands") || "Bütün markalar"}
      </span>
    );
  }

  if (!brands?.length) {
    return <span className={className}>—</span>;
  }

  return (
    <span className={className}>{brands.map((b) => b.title).join(", ")}</span>
  );
}
