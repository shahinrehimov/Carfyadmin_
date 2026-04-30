import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import DeleteModal from "@/components/ui/delete-modal";
import { Switch } from "@/components/ui/switch";
import {
  useStaticPage,
  useDeletePageImage,
  useTogglePageStatus,
} from "@/lib/queries/static-pages";
import { useTranslation } from "@/lib/utils/translationLoader";
import { useTranslationStore } from "@/store/translations";

export const Route = createFileRoute("/_app/static-pages/$id/")({
  component: ShowStaticPageComponent,
});

function ShowStaticPageComponent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = Route.useParams();
  const pageId = Number(id);
  const langs = useTranslationStore((state) => state.langs);

  const { data: page, isLoading } = useStaticPage(pageId);
  const deleteImageMutation = useDeletePageImage();
  const toggleMutation = useTogglePageStatus();

  const [selectedLangId, setSelectedLangId] = useState<number | null>(null);
  const [deleteImageModal, setDeleteImageModal] = useState<{
    mediaId: number;
    index: number;
  } | null>(null);

  const currentLangId =
    selectedLangId ?? page?.translations?.[0]?.language_id ?? null;
  const currentTranslation = page?.translations?.find(
    (tr) => tr.language_id === currentLangId,
  );

  const handleToggle = async () => {
    if (!page) return;
    try {
      await toggleMutation.mutateAsync(page.id);
      toast.success(t("status_updated"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const handleDeleteImage = async () => {
    if (!deleteImageModal) return;
    try {
      await deleteImageMutation.mutateAsync({
        pageId,
        mediaId: deleteImageModal.mediaId,
      });
      toast.success(t("deleted_successfully"));
      setDeleteImageModal(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="py-10 text-center text-red-500">{t("not_found")}</div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.navigate({ to: "/static-pages" })}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="flex-1 text-2xl font-semibold">
          {currentTranslation?.title
            ? currentTranslation.title.replace(/<[^>]*>/g, "")
            : t("page_details")}
        </h1>
        <Button variant="outline" asChild>
          <Link to="/static-pages/$id/edit" params={{ id }}>
            <Pencil className="mr-2 h-4 w-4" />
            {t("edit")}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: info + images */}
        <div className="lg:col-span-1 space-y-4">
          {/* Basic info card */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <h2 className="font-semibold text-sm uppercase text-gray-500 tracking-wide">
              {t("basic_information")}
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">ID</span>
                <span className="font-medium">{page.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("slug")}</span>
                <span className="font-medium">{page.slug || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("sort")}</span>
                <span className="font-medium">{page.sort}</span>
              </div>
              {page.created_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("created_date")}</span>
                  <span className="font-medium">{page.created_date}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1">
                <span className="text-gray-500">{t("status")}</span>
                <Switch
                  checked={page.is_active}
                  disabled={toggleMutation.isPending}
                  onCheckedChange={handleToggle}
                />
              </div>
            </div>
          </div>

          {/* Main Image */}
          {page.main_image && (
            <div className="rounded-lg border bg-card p-4 space-y-2">
              <h2 className="font-semibold text-sm uppercase text-gray-500 tracking-wide">
                {t("main_image")}
              </h2>
              <img
                src={page.main_image}
                alt={t("main_image")}
                className="w-full rounded object-cover max-h-48"
              />
            </div>
          )}

          {/* Icon */}
          {page.icon && (
            <div className="rounded-lg border bg-card p-4 space-y-2">
              <h2 className="font-semibold text-sm uppercase text-gray-500 tracking-wide">
                {t("icon")}
              </h2>
              <img
                src={page.icon}
                alt={t("icon")}
                className="w-full rounded object-contain max-h-32 bg-gray-50"
              />
            </div>
          )}

          {/* Gallery */}
          {page.images?.urls?.length ? (
            <div className="rounded-lg border bg-card p-4 space-y-2">
              <h2 className="font-semibold text-sm uppercase text-gray-500 tracking-wide">
                {t("gallery_images")}
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {page.images.urls.map((url, index) => (
                  <div
                    key={index}
                    className="relative h-24 rounded overflow-hidden border"
                  >
                    <img
                      src={url}
                      alt={`${t("image")} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {page.images?.media_ids?.[index] && (
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteImageModal({
                            mediaId: page.images!.media_ids[index],
                            index,
                          })
                        }
                        className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Right column: translations */}
        <div className="lg:col-span-2 rounded-lg border bg-card p-4 space-y-4">
          <h2 className="font-semibold text-sm uppercase text-gray-500 tracking-wide">
            {t("translations")}
          </h2>

          {/* Language tabs */}
          <div className="flex gap-2 flex-wrap border-b pb-3">
            {page.translations?.map((tr) => {
              const lang = langs.find((l) => l.id === tr.language_id);
              return (
                <button
                  key={tr.language_id}
                  type="button"
                  onClick={() => setSelectedLangId(tr.language_id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    currentLangId === tr.language_id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {lang?.key?.toUpperCase() || tr.language_id}
                </button>
              );
            })}
          </div>

          {currentTranslation ? (
            <div className="space-y-4">
              {currentTranslation.title && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t("title")}</p>
                  <div
                    className="text-sm font-medium prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: currentTranslation.title,
                    }}
                  />
                </div>
              )}

              {currentTranslation.description && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    {t("description")}
                  </p>
                  <div
                    className="text-sm prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: currentTranslation.description,
                    }}
                  />
                </div>
              )}

              {currentTranslation.body && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t("body")}</p>
                  <div className="rounded-md border p-3 bg-gray-50 dark:bg-gray-900">
                    <div
                      className="text-sm prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: currentTranslation.body,
                      }}
                    />
                  </div>
                </div>
              )}

              {(currentTranslation.meta_title ||
                currentTranslation.meta_description ||
                currentTranslation.meta_keywords) && (
                <div className="border-t pt-4 space-y-3">
                  <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                    SEO
                  </h3>
                  {currentTranslation.meta_title && (
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">
                        {t("meta_title")}
                      </p>
                      <p className="text-sm">{currentTranslation.meta_title}</p>
                    </div>
                  )}
                  {currentTranslation.meta_keywords && (
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">
                        {t("meta_keywords")}
                      </p>
                      <p className="text-sm">
                        {currentTranslation.meta_keywords}
                      </p>
                    </div>
                  )}
                  {currentTranslation.meta_description && (
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">
                        {t("meta_description")}
                      </p>
                      <p className="text-sm">
                        {currentTranslation.meta_description}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">{t("no_data_found")}</p>
          )}
        </div>
      </div>

      {/* Delete gallery image modal */}
      <Modal
        isOpen={!!deleteImageModal}
        onClose={() => setDeleteImageModal(null)}
        title={t("delete")}
        size="sm"
      >
        <DeleteModal
          closeModal={() => setDeleteImageModal(null)}
          handleDelete={handleDeleteImage}
          pending={deleteImageMutation.isPending}
        />
      </Modal>
    </div>
  );
}
