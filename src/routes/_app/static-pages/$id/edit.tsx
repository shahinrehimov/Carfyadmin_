import { useState, useEffect } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import ImageUploader from "@/components/ui/image-uploader";
import {
  useStaticPage,
  useUpdateStaticPage,
  useDeletePageImage,
} from "@/lib/queries/static-pages";
import { useTranslation } from "@/lib/utils/translationLoader";
import { useTranslationStore } from "@/store/translations";

export const Route = createFileRoute("/_app/static-pages/$id/edit")({
  component: EditStaticPageComponent,
});

interface FileData {
  file?: File | null | string;
  preview?: string;
  media_id?: number;
}

function EditStaticPageComponent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = Route.useParams();
  const pageId = Number(id);
  const langs = useTranslationStore((state) => state.langs);

  const { data: pageData, isLoading } = useStaticPage(pageId);
  const updateMutation = useUpdateStaticPage();
  const deleteImageMutation = useDeletePageImage();

  const [mainImage, setMainImage] = useState<FileData>({});
  const [iconImage, setIconImage] = useState<FileData>({});
  const [galleryImages, setGalleryImages] = useState<FileData[]>([]);
  const [newGalleryImages, setNewGalleryImages] = useState<FileData[]>([]);

  const schema = z.object({
    slug: z.string().optional(),
    sort: z.coerce.number({ invalid_type_error: t("required_field") }),
    translations: z.array(
      z.object({
        language_id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        body: z.string().optional(),
        meta_title: z.string().optional(),
        meta_description: z.string().optional(),
        meta_keywords: z.string().optional(),
      }),
    ),
  });

  type FormData = z.infer<typeof schema>;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      slug: "",
      sort: 0,
      translations: langs.map((lang) => ({
        language_id: lang.id,
        title: "",
        description: "",
        body: "",
        meta_title: "",
        meta_description: "",
        meta_keywords: "",
      })),
    },
  });

  useEffect(() => {
    if (pageData && langs.length > 0) {
      if (pageData.main_image) {
        setMainImage({ file: "existing", preview: pageData.main_image });
      }
      if (pageData.icon) {
        setIconImage({ file: "existing", preview: pageData.icon });
      }
      if (pageData.images?.urls?.length) {
        setGalleryImages(
          pageData.images.urls.map((url, i) => ({
            file: "existing",
            preview: url,
            media_id: pageData.images?.media_ids?.[i],
          })),
        );
      }

      reset({
        slug: pageData.slug || "",
        sort: pageData.sort ?? 0,
        translations: langs.map((lang) => {
          const tr = pageData.translations?.find(
            (t) => t.language_id === lang.id,
          );
          return {
            language_id: lang.id,
            title: tr?.title || "",
            description: tr?.description || "",
            body: tr?.body || "",
            meta_title: tr?.meta_title || "",
            meta_description: tr?.meta_description || "",
            meta_keywords: tr?.meta_keywords || "",
          };
        }),
      });
    }
  }, [pageData, langs, reset]);

  const addNewGalleryImage = () => {
    setNewGalleryImages((prev) => [...prev, {}]);
  };

  const removeNewGalleryImage = (index: number) => {
    setNewGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNewGalleryImageChange = (index: number, newImage: FileData) => {
    setNewGalleryImages((prev) => {
      const updated = [...prev];
      updated[index] = newImage;
      return updated;
    });
  };

  const handleDeleteGalleryImage = async (mediaId: number, index: number) => {
    try {
      await deleteImageMutation.mutateAsync({ pageId, mediaId });
      setGalleryImages((prev) => prev.filter((_, i) => i !== index));
      toast.success(t("deleted_successfully"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const onSubmit = async (data: FormData) => {
    const formData = new FormData();

    if (data.slug) formData.append("slug", data.slug);
    formData.append("sort", String(data.sort));

    if (mainImage?.file && mainImage.file instanceof File) {
      formData.append("main_image", mainImage.file);
    }
    if (iconImage?.file && iconImage.file instanceof File) {
      formData.append("icon", iconImage.file);
    }

    newGalleryImages.forEach((img, index) => {
      if (img?.file && img.file instanceof File) {
        formData.append(`images[${index}]`, img.file);
      }
    });

    const translationFields = [
      "title",
      "description",
      "body",
      "meta_title",
      "meta_description",
      "meta_keywords",
    ] as const;

    langs.forEach((lang, index) => {
      const translation = data.translations[index];
      formData.append(`translations[${index}][language_id]`, String(lang.id));
      translationFields.forEach((field) => {
        if (translation?.[field]) {
          formData.append(
            `translations[${index}][${field}]`,
            translation[field]!,
          );
        }
      });
    });

    try {
      const res = await updateMutation.mutateAsync({ id: pageId, formData });
      toast.success(res.message || t("updated_successfully"));
      router.navigate({ to: "/static-pages" });
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

  if (!isLoading && !pageData) {
    return (
      <div className="py-10 text-center text-red-500">{t("not_found")}</div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.navigate({ to: "/static-pages" })}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold">{t("edit_page")}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
        {/* Images */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium border-b pb-2">{t("images")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>
                {t("main_image")} ({t("optional")})
              </Label>
              <ImageUploader file={mainImage} setFile={setMainImage} />
            </div>
            <div className="space-y-2">
              <Label>
                {t("icon")} ({t("optional")})
              </Label>
              <ImageUploader file={iconImage} setFile={setIconImage} />
            </div>
          </div>

          {/* Existing gallery images */}
          {galleryImages.length > 0 && (
            <div className="space-y-2">
              <Label>{t("gallery_images")}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {galleryImages.map((img, index) => (
                  <div
                    key={`existing-${index}`}
                    className="relative h-32 rounded-md overflow-hidden border"
                  >
                    <img
                      src={img.preview}
                      alt={`gallery-${index}`}
                      className="h-full w-full object-cover"
                    />
                    {img.media_id && (
                      <button
                        type="button"
                        disabled={deleteImageMutation.isPending}
                        onClick={() =>
                          handleDeleteGalleryImage(img.media_id!, index)
                        }
                        className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-red-50 transition-colors"
                      >
                        {deleteImageMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="h-3 w-3 text-red-500" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add new gallery images */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                {t("additional_images")} ({t("optional")})
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addNewGalleryImage}
              >
                <Plus className="mr-1 h-4 w-4" />
                {t("add_image")}
              </Button>
            </div>
            {newGalleryImages.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {newGalleryImages.map((image, index) => (
                  <div key={`new-${index}`} className="border rounded-md p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {t("image")} {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500"
                        onClick={() => removeNewGalleryImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <ImageUploader
                      file={image}
                      setFile={(newImage) =>
                        handleNewGalleryImageChange(index, newImage)
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Basic Info */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium border-b pb-2">
            {t("basic_information")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slug">{t("slug")}</Label>
              <Controller
                name="slug"
                control={control}
                render={({ field }) => (
                  <Input
                    id="slug"
                    {...field}
                    placeholder={t("slug")}
                    className={errors.slug ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.slug && (
                <p className="text-red-500 text-sm">{errors.slug.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort">{t("sort")} *</Label>
              <Controller
                name="sort"
                control={control}
                render={({ field }) => (
                  <Input
                    id="sort"
                    type="number"
                    {...field}
                    className={errors.sort ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.sort && (
                <p className="text-red-500 text-sm">{errors.sort.message}</p>
              )}
            </div>
          </div>
        </section>

        {/* Translations */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium border-b pb-2">
            {t("translations")}
          </h2>
          {langs.length > 0 && (
            <Tabs defaultValue={String(langs[0].id)}>
              <TabsList>
                {langs.map((lang) => (
                  <TabsTrigger key={lang.id} value={String(lang.id)}>
                    {lang.key?.toUpperCase()}
                  </TabsTrigger>
                ))}
              </TabsList>

              {langs.map((lang, index) => (
                <TabsContent
                  key={lang.id}
                  value={String(lang.id)}
                  className="pt-4 space-y-4"
                >
                  <div className="space-y-2">
                    <Label>
                      {t("title")}
                      {index === 0 ? " *" : ""}
                    </Label>
                    <Controller
                      name={`translations.${index}.title`}
                      control={control}
                      render={({ field }) => (
                        <RichTextEditor
                          value={field.value || ""}
                          onChange={field.onChange}
                          minHeight="100px"
                        />
                      )}
                    />
                    {errors.translations?.[index]?.title && (
                      <p className="text-red-500 text-sm">
                        {errors.translations[index]?.title?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{t("description")}</Label>
                    <Controller
                      name={`translations.${index}.description`}
                      control={control}
                      render={({ field }) => (
                        <RichTextEditor
                          value={field.value || ""}
                          onChange={field.onChange}
                          minHeight="150px"
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("body")}</Label>
                    <Controller
                      name={`translations.${index}.body`}
                      control={control}
                      render={({ field }) => (
                        <RichTextEditor
                          value={field.value || ""}
                          onChange={field.onChange}
                          minHeight="300px"
                        />
                      )}
                    />
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <h3 className="text-sm font-semibold uppercase text-gray-500 tracking-wide">
                      SEO
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t("meta_title")}</Label>
                        <Controller
                          name={`translations.${index}.meta_title`}
                          control={control}
                          render={({ field }) => (
                            <Input {...field} placeholder={t("meta_title")} />
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("meta_keywords")}</Label>
                        <Controller
                          name={`translations.${index}.meta_keywords`}
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              placeholder={t("meta_keywords")}
                            />
                          )}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("meta_description")}</Label>
                      <Controller
                        name={`translations.${index}.meta_description`}
                        control={control}
                        render={({ field }) => (
                          <textarea
                            {...field}
                            rows={3}
                            placeholder={t("meta_description")}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          />
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </section>

        <div className="flex justify-start pt-2">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="min-w-[160px]"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("saving")}
              </>
            ) : (
              t("update_page")
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
