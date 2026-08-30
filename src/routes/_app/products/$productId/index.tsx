import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  History,
  Image as ImageIcon,
  Loader2,
  Package,
  PackageCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import {
  useProduct,
  useProductRevisions,
  useApproveProductRevision,
  useRejectProductRevision,
} from "@/lib/queries/products";
import type { ProductRevision } from "@/lib/queries/products";
import { ProductBrands } from "@/components/fitment/ProductBrands";
import { useTranslation } from "@/lib/utils/translationLoader";

export const Route = createFileRoute("/_app/products/$productId/")({
  component: RouteComponent,
});

function ProductRevisionsModal({ productId, onClose }: { productId: number; onClose: () => void }) {
  const { t } = useTranslation();
  const { data: revisions, isLoading, refetch } = useProductRevisions(productId, true);
  const approveMutation = useApproveProductRevision();
  const rejectMutation = useRejectProductRevision();
  const [rejectMessage, setRejectMessage] = useState("");
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const handleApprove = async (revision: ProductRevision) => {
    try {
      await approveMutation.mutateAsync(revision.id);
      toast.success(t("approved_successfully"));
      refetch();
    } catch {
      toast.error(t("error_occurred"));
    }
  };

  const handleReject = async (revisionId: number) => {
    try {
      await rejectMutation.mutateAsync({ id: revisionId, message: rejectMessage });
      toast.success(t("rejected_successfully"));
      setRejectingId(null);
      setRejectMessage("");
      refetch();
    } catch {
      toast.error(t("error_occurred"));
    }
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : !revisions?.length ? (
        <p className="py-6 text-center text-gray-500">{t("no_data_found")}</p>
      ) : (
        <div className="space-y-4">
          {revisions.map((revision) => (
            <div key={revision.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {revision.status === "pending" && <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>}
                  {revision.status === "approved" && <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>}
                  {revision.status === "rejected" && <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>}
                  {revision.company && <span className="text-sm text-gray-500">{revision.company.title}</span>}
                </div>
                <span className="text-xs text-gray-400">{revision.created_date}</span>
              </div>

              {/* Translations */}
              {revision.data.translations?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500">{t("translations")}</p>
                  {revision.data.translations.map((tr) => (
                    <div key={tr.language_id} className="rounded bg-blue-50 dark:bg-blue-950 p-2 text-sm space-y-0.5">
                      <p className="text-xs text-blue-600 font-medium">{t("language")} #{tr.language_id}</p>
                      {tr.title && <p><span className="text-gray-500">{t("title")}:</span> {tr.title}</p>}
                      {tr.description_short && <p><span className="text-gray-500">{t("description_short")}:</span> {tr.description_short}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Images */}
              {(revision.images.main_image || revision.images.images.length > 0) && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500">{t("images")}</p>
                  <div className="flex flex-wrap gap-2">
                    {revision.images.main_image && (
                      <img src={revision.images.main_image} alt="main" className="h-16 w-16 rounded object-cover border" />
                    )}
                    {revision.images.hover_image && (
                      <img src={revision.images.hover_image} alt="hover" className="h-16 w-16 rounded object-cover border" />
                    )}
                    {revision.images.images.map((img) => (
                      <img key={img.id} src={img.url} alt="" className="h-16 w-16 rounded object-cover border" />
                    ))}
                  </div>
                </div>
              )}

              {revision.rejection_message && (
                <p className="rounded bg-red-50 dark:bg-red-950 p-2 text-sm text-red-700">{revision.rejection_message}</p>
              )}

              {revision.status === "pending" && (
                <div className="space-y-2">
                  {rejectingId === revision.id ? (
                    <div className="space-y-2">
                      <textarea
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        rows={2}
                        placeholder={t("rejection_message") || "Rədd etmə səbəbi..."}
                        value={rejectMessage}
                        onChange={(e) => setRejectMessage(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" onClick={() => handleReject(revision.id)} disabled={rejectMutation.isPending}>
                          {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("confirm_reject") || "Rədd et"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setRejectingId(null)}>{t("cancel")}</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApprove(revision)} disabled={approveMutation.isPending}>
                        {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4 mr-1" />{t("approve")}</>}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setRejectingId(revision.id)}>
                        <XCircle className="h-4 w-4 mr-1" />{t("reject")}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>{t("close")}</Button>
      </div>
    </div>
  );
}

function RouteComponent() {
  const { t } = useTranslation();
  const { productId } = Route.useParams();
  const id = Number(productId);
  const [showRevisionsModal, setShowRevisionsModal] = useState(false);

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
        <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      {/* Revisions Modal */}
      <Modal
        isOpen={showRevisionsModal}
        title={t("product_revisions") || "Məhsul Reviziyaları"}
        onClose={() => setShowRevisionsModal(false)}
      >
        <ProductRevisionsModal productId={id} onClose={() => setShowRevisionsModal(false)} />
      </Modal>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
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
        <Button variant="outline" size="sm" onClick={() => setShowRevisionsModal(true)}>
          <History className="mr-2 h-4 w-4" />
          {t("revisions") || "Reviziyalar"}
        </Button>
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
                <p className="mt-0.5 font-medium">
                  <ProductBrands
                    brands={product.brands}
                    isUniversal={product.is_universal}
                  />
                </p>
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
