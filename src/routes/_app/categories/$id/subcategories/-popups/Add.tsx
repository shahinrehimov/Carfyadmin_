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
import { useCreateSubCategory } from "@/lib/queries/categories";
import { useTranslation } from "@/lib/utils/translationLoader";
import { useLangs } from "@/lib/queries/langs";
import ImageUploader from "@/components/ui/image-uploader";

interface AddProps {
  categoryId: number;
  onClose: () => void;
}

const AddFormSchema = z.object({
  category_id: z.number(),
  slug: z.string().optional(),
  sort: z.number().min(0, "Sort must be 0 or greater"),
  // Empty string = inherit the platform rate
  commission_percent: z
    .string()
    .refine(
      (val) =>
        val === "" ||
        (!Number.isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100),
      { message: "0 - 100" },
    ),
  translations: z.array(
    z.object({
      language_id: z.number(),
      title: z.string().min(1, "Title is required"),
    })
  ),
});

type AddFormData = z.infer<typeof AddFormSchema>;

const Add: React.FC<AddProps> = ({ categoryId, onClose }) => {
  const { t } = useTranslation();
  const { data: langs = [] } = useLangs();
  const [file, setFile] = useState<{
    file?: File | null | string;
    preview?: string;
  }>({});

  const form = useForm<AddFormData>({
    resolver: zodResolver(AddFormSchema),
    defaultValues: {
      category_id: categoryId,
      slug: "",
      sort: 0,
      commission_percent: "",
      translations: [],
    },
  });

  // Update translations when langs data is loaded
  useEffect(() => {
    if (langs.length > 0) {
      form.reset({
        category_id: categoryId,
        slug: "",
        sort: 0,
      commission_percent: "",
        translations: langs.map((lang: any) => ({
          language_id: lang.id,
          title: "",
        })),
      });
    }
  }, [langs, categoryId, form]);

  const createSubCategoryMutation = useCreateSubCategory();

  const onSubmit = async (data: AddFormData) => {
    if (!file.file || typeof file.file === "string") {
      toast.error(t("image_is_required"));
      return;
    }

    try {
      const response = await createSubCategoryMutation.mutateAsync({
        category_id: categoryId,
        translations: data.translations,
        slug: data.slug,
        sort: data.sort,
        // Empty means "no category override" — send null so the API clears it
        commission_percent:
          data.commission_percent === ""
            ? null
            : Number(data.commission_percent),
        image: file.file,
      });
      toast.success(response.message || t("subcategory_created_successfully"));
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

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
                  <p className="text-sm text-gray-500">{t("leave_empty_for_auto_generation")}</p>
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
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="commission_percent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("commission_percent")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="—"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-sm text-gray-500">
                    {t("commission_percent_hint")}
                  </p>
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
              disabled={createSubCategoryMutation.isPending}
            >
              {createSubCategoryMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Add;
