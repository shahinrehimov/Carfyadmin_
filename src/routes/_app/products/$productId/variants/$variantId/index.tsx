import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import DeleteModal from "@/components/ui/delete-modal";
import { Switch } from "@/components/ui/switch";
import {
  useProductVariant,
  useToggleVariantStatus,
  useDeleteProductVariant,
} from "@/lib/queries/products";
import { FitmentSummary } from "@/components/fitment/FitmentSummary";
import { useTranslation } from "@/lib/utils/translationLoader";

export const Route = createFileRoute(
  "/_app/products/$productId/variants/$variantId/",
)({
  component: RouteComponent,
});

type ModalType = null | "delete";

function RouteComponent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { productId, variantId } = Route.useParams();
  const id = Number(variantId);

  const [modalType, setModalType] = useState<ModalType>(null);

  const { data: variant, isLoading, error } = useProductVariant(id);
  const toggleStatusMutation = useToggleVariantStatus();
  const deleteMutation = useDeleteProductVariant();

  const handleToggleStatus = async () => {
    if (!variant) return;
    try {
      await toggleStatusMutation.mutateAsync({
        id: variant.id,
        isActive: variant.is_active,
      });
      toast.success(t("status_updated_successfully"));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t("failed_to_update_status"));
    }
  };

  const handleDelete = async () => {
    if (!variant) return;
    try {
      await deleteMutation.mutateAsync(variant.id);
      toast.success(t("variant_deleted_successfully") || t("deleted_successfully"));
      setModalType(null);
      navigate({ to: "/products/$productId/variants", params: { productId } });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t("failed_to_delete"));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 py-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !variant) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600">{t("error_loading_data")}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{variant.slug}</h1>
          <Badge variant={variant.is_active ? "default" : "secondary"}>
            {variant.is_active ? t("active") : t("inactive")}
          </Badge>
          {variant.is_default && (
            <Badge variant="outline">{t("default")}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalType("delete")}
            className="gap-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            {t("delete")}
          </Button>
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
              {variant.main_image ? (
                <img
                  src={variant.main_image}
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
              {variant.hover_image ? (
                <img
                  src={variant.hover_image}
                  alt="hover"
                  className="h-40 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-lg bg-gray-100">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            {variant.images?.urls && variant.images.urls.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-gray-500">{t("gallery")}</p>
                <div className="grid grid-cols-3 gap-2">
                  {variant.images.urls.map((url, i) => (
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
          {/* Pricing & Stock */}
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              {t("pricing_and_stock")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500">{t("price")}</p>
                <p className="mt-0.5 text-lg font-semibold">{variant.price} ₼</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("final_price")}</p>
                <p className="mt-0.5 text-lg font-semibold text-green-600">
                  {variant.price_final} ₼
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("discount")}</p>
                <p className="mt-0.5 font-medium">
                  {variant.discount > 0
                    ? `${variant.discount}${variant.discount_type === "by_percentage" ? "%" : " ₼"}`
                    : "—"}
                </p>
              </div>
              {variant.discount_start_at && (
                <div>
                  <p className="text-xs text-gray-500">{t("discount_start")}</p>
                  <p className="mt-0.5 text-sm">{variant.discount_start_at}</p>
                </div>
              )}
              {variant.discount_end_at && (
                <div>
                  <p className="text-xs text-gray-500">{t("discount_end")}</p>
                  <p className="mt-0.5 text-sm">{variant.discount_end_at}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">{t("stock")}</p>
                <Badge
                  variant={variant.stock > 0 ? "default" : "destructive"}
                  className="mt-0.5"
                >
                  {variant.stock}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("size_category")}</p>
                <p className="mt-0.5 font-medium capitalize">
                  {(typeof variant.size_category === "object" ? variant.size_category?.value : variant.size_category) || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("weight_gram")}</p>
                <p className="mt-0.5 font-medium">
                  {variant.weight_gram ? `${variant.weight_gram} g` : "—"}
                </p>
              </div>
            </div>
          </Card>

          {/* General Info */}
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              {t("general_info")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500">{t("city")}</p>
                <p className="mt-0.5 font-medium">{variant.city?.title ?? "—"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-500">{t("fitment") || "Uyğunluq"}</p>
                <div className="mt-1">
                  <FitmentSummary
                    fitments={variant.fitments}
                    isUniversal={variant.is_universal}
                  />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("product")}</p>
                <Link
                  to="/products/$productId"
                  params={{ productId }}
                  className="mt-0.5 font-medium text-blue-600 hover:underline"
                >
                  {variant.product.title}
                </Link>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 border-t pt-4">
              <p className="text-sm text-gray-500">{t("status")}</p>
              <Switch
                checked={variant.is_active}
                onCheckedChange={handleToggleStatus}
                disabled={toggleStatusMutation.isPending}
              />
            </div>
          </Card>

          {/* Options */}
          {variant.options && variant.options.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                {t("options")}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {variant.options.map((opt) => {
                  const selectedItem = opt.option.has_items
                    ? opt.option.items.find((item) => item.id === Number(opt.value))
                    : null;

                  return (
                    <div key={opt.id}>
                      <p className="text-xs text-gray-500">
                        {opt.option.title}
                        {opt.option.is_required && (
                          <span className="ml-1 text-red-400">*</span>
                        )}
                      </p>
                      <p className="mt-0.5 font-medium">
                        {selectedItem ? selectedItem.title : String(opt.value) || "—"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={modalType === "delete"}
        onClose={() => setModalType(null)}
        title={t("delete_variant") || "Variantı sil"}
        size="sm"
      >
        <DeleteModal
          title={`${t("delete_confirm_message") || "Silmək istədiyinizə əminsiniz?"} "${variant.slug}"`}
          closeModal={() => setModalType(null)}
          handleDelete={handleDelete}
          pending={deleteMutation.isPending}
        />
      </Modal>
    </div>
  );
}
