import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useBrand, useUpdateBrand } from "@/lib/queries/brands";
import { useTranslation } from "@/lib/utils/translationLoader";
import { useLangs } from "@/lib/queries/langs";
import ImageUploader from "@/components/ui/image-uploader";

interface EditProps {
  brandId: number;
  onClose: () => void;
}

const EditFormSchema = z.object({
  slug: z.string().optional(),
  sort: z.number().min(0, "Sort must be 0 or greater"),
  translations: z.array(
    z.object({
      language_id: z.number(),
      title: z.string().min(1, "Title is required"),
    }),
  ),
});

type EditFormData = z.infer<typeof EditFormSchema>;

const Edit: React.FC<EditProps> = ({ brandId, onClose }) => {
  const { t } = useTranslation();
  const { data: langs = [] } = useLangs();
  const { data: brand, isLoading } = useBrand(brandId);
  const [file, setFile] = useState<{
    file?: File | null | string;
    preview?: string;
  }>({});

  const form = useForm<EditFormData>({
    resolver: zodResolver(EditFormSchema),
    defaultValues: {
      slug: "",
      sort: 0,
      translations: [],
    },
  });

  useEffect(() => {
    if (brand && langs.length > 0) {
      const brandData = brand as any;
      form.reset({
        slug: brandData.slug || "",
        sort: brandData.sort || 0,
        translations:
          brandData.translations?.map((translation: any) => ({
            language_id: translation.language_id,
            title: translation.title,
          })) ||
          langs.map((lang: any) => ({
            language_id: lang.id,
            title: "",
          })),
      });

      if (brandData.image) {
        setFile({ file: brandData.image, preview: brandData.image });
      }
    }
  }, [brand, langs, form]);

  const updateBrandMutation = useUpdateBrand();

  const onSubmit = async (data: EditFormData) => {
    try {
      const response = await updateBrandMutation.mutateAsync({
        id: brandId,
        data: {
          translations: data.translations,
          slug: data.slug,
          sort: data.sort,
          image: file.file instanceof File ? file.file : undefined,
        },
      });
      toast.success(response.message || t("brand_updated_successfully"));
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl min-w-[300px] py-12 md:min-w-[650px]">
        <div className="flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl min-w-[300px] md:min-w-[650px]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Titles Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("titles")}</h3>
            {langs.map((lang: any, index: number) => (
              <FormField
                key={lang.id}
                control={form.control}
                name={`translations.${index}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("title")} {langs.length > 1 ? `- ${lang.key}` : ""}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder={t("title")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>

          {/* Image Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("image")}</h3>
            <ImageUploader file={file} setFile={setFile} />
          </div>

          {/* Settings Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("settings")}</h3>

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("slug")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("slug")} {...field} />
                  </FormControl>
                  <p className="text-sm text-gray-500">
                    {t("leave_empty_for_auto_generation")}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("sort_order")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={t("sort_order")}
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-center">
            <Button
              type="submit"
              variant="destructive"
              className="min-w-[300px]"
              disabled={updateBrandMutation.isPending}
            >
              {updateBrandMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Edit;
