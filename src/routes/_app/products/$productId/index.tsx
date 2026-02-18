import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Image as ImageIcon, Package, PackageCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useProduct } from "@/lib/queries/products";
import { useTranslation } from "@/lib/utils/translationLoader";

export const Route = createFileRoute("/_app/products/$productId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const { productId } = Route.useParams();
  const id = Number(productId);

  const { data: product, isLoading, error } = useProduct(id);

  if (isLoading) {
    return (
      <div className="space-y-6 py-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 animate-pulse rounded bg-gray-200"></div>
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-200"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600">{t("error_loading_data")}</p>
        <Link to="/products">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("back")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">
            {product.translations?.[0]?.title || product.slug}
          </h1>
          {product.is_set ? (
            <Badge variant="secondary">
              <PackageCheck className="mr-1 h-3 w-3" />
              {t("set")}
            </Badge>
          ) : (
            <Badge variant="outline">
              <Package className="mr-1 h-3 w-3" />
              {t("single")}
            </Badge>
          )}
          <Badge variant={product.is_active ? "default" : "destructive"}>
            {product.is_active ? t("active") : t("inactive")}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Images */}
        <Card className="p-6 lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {t("images")}
          </h2>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs text-gray-500">{t("main_image")}</p>
              {product.main_image ? (
                <img
                  src={product.main_image}
                  alt="main"
                  className="h-40 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-lg bg-gray-100">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs text-gray-500">{t("hover_image")}</p>
              {product.hover_image ? (
                <img
                  src={product.hover_image}
                  alt="hover"
                  className="h-40 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-lg bg-gray-100">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            {product.images?.urls && product.images.urls.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-gray-500">{t("gallery")}</p>
                <div className="grid grid-cols-3 gap-2">
                  {product.images.urls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`gallery-${i}`}
                      className="h-20 w-full rounded object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* General Info */}
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              {t("general_info")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500">{t("slug")}</p>
                <p className="mt-0.5 font-medium">{product.slug}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("brand")}</p>
                <p className="mt-0.5 font-medium">{product.brand.title}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("main_category")}</p>
                <div className="mt-0.5">
                  <p className="font-medium">{product.main_category.title}</p>
                  {product.main_category.parent && (
                    <p className="text-xs text-gray-400">
                      {product.main_category.parent.title}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("variants_count")}</p>
                <p className="mt-0.5 font-medium">{product.variants_count}</p>
              </div>
              {product.categories && product.categories.length > 1 && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500">{t("categories")}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {product.categories.map((cat) => (
                      <Badge key={cat.id} variant="outline" className="text-xs">
                        {cat.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Translations */}
          {product.translations && product.translations.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                {t("translations")}
              </h2>
              <div className="space-y-6">
                {product.translations.map((translation) => (
                  <div
                    key={translation.language_id}
                    className="rounded-lg border p-4"
                  >
                    <p className="mb-3 text-xs font-semibold uppercase text-gray-400">
                      {t("language")} #{translation.language_id}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-gray-500">{t("title")}</p>
                        <p className="mt-0.5 font-medium">
                          {translation.title || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">
                          {t("description_short")}
                        </p>
                        <p className="mt-0.5 text-sm">
                          {translation.description_short || "—"}
                        </p>
                      </div>
                      {translation.description && (
                        <div className="sm:col-span-2">
                          <p className="text-xs text-gray-500">
                            {t("description")}
                          </p>
                          <p className="mt-0.5 text-sm">
                            {translation.description}
                          </p>
                        </div>
                      )}
                      {translation.delivery && (
                        <div>
                          <p className="text-xs text-gray-500">{t("delivery")}</p>
                          <p className="mt-0.5 text-sm">{translation.delivery}</p>
                        </div>
                      )}
                      {translation.note && (
                        <div>
                          <p className="text-xs text-gray-500">{t("note")}</p>
                          <p className="mt-0.5 text-sm">{translation.note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
