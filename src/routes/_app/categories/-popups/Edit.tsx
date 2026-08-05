import React, { useState, useEffect } from "react";
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
import { useUpdateCategory, useCategory } from "@/lib/queries/categories";
import { useTranslation } from "@/lib/utils/translationLoader";
import { useLangs } from "@/lib/queries/langs";
import ImageUploader from "@/components/ui/image-uploader";
import {
  CommissionTiersEditor,
  rowsToTiers,
  tiersToRows,
  validateCommissionTiers,
  type CommissionTierRow,
} from "@/components/ui/commission-tiers-editor";

interface EditProps {
  categoryId: number;
  onClose: () => void;
}

const EditFormSchema = z.object({
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

type EditFormData = z.infer<typeof EditFormSchema>;

const Edit: React.FC<EditProps> = ({ categoryId, onClose }) => {
  const { t } = useTranslation();
  const { data: langs = [] } = useLangs();
  const { data: category, isLoading: isCategoryLoading } = useCategory(categoryId);
  const [file, setFile] = useState<{ file?: File | null | string; preview?: string }>({});

  const [commissionTiers, setCommissionTiers] = useState<CommissionTierRow[]>([]);
  const [commissionTiersError, setCommissionTiersError] = useState<string | null>(null);

  const form = useForm<EditFormData>({
    resolver: zodResolver(EditFormSchema),
    defaultValues: {
      slug: "",
      sort: 0,
      commission_percent: "",
      translations: langs.map((lang: any) => ({
        language_id: lang.id,
        title: "",
      })),
    },
  });

  const updateCategoryMutation = useUpdateCategory();

  useEffect(() => {
    if (category && langs.length > 0) {
      const categoryData = category as any;
      form.reset({
        slug: categoryData.slug || "",
        sort: categoryData.sort || 0,
        commission_percent:
          categoryData.commission_percent === null ||
          categoryData.commission_percent === undefined
            ? ""
            : String(categoryData.commission_percent),
        translations:
          categoryData.translations?.map((translation: any) => ({
            language_id: translation.language_id,
            title: translation.title,
          })) ||
          langs.map((lang: any) => ({
            language_id: lang.id,
            title: "",
          })),
      });

      setCommissionTiers(tiersToRows(categoryData.commission_tiers));
      setCommissionTiersError(null);

      // Set existing image if available
      if (categoryData.image) {
        setFile({ file: categoryData.image, preview: categoryData.image });
      }
    }
  }, [category, langs, form]);

  const onSubmit = async (data: EditFormData) => {
    const tiersError = validateCommissionTiers(commissionTiers);

    if (tiersError) {
      setCommissionTiersError(tiersError);
      toast.error(t(tiersError));
      return;
    }

    setCommissionTiersError(null);

    try {
      const requestData: any = {
        translations: data.translations,
        slug: data.slug,
        sort: data.sort,
        // Empty means "no category override" — send null so the API clears it
        commission_percent:
          data.commission_percent === ""
            ? null
            : Number(data.commission_percent),
        commission_tiers: rowsToTiers(commissionTiers),
      };

      // Only include image if a new file was selected
      if (file.file && typeof file.file !== "string") {
        requestData.image = file.file;
      }

      const response = await updateCategoryMutation.mutateAsync({
        id: categoryId,
        data: requestData,
      });
      toast.success(response.message || t("category_updated_successfully"));
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  if (isCategoryLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
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

            <CommissionTiersEditor
              value={commissionTiers}
              onChange={(rows) => {
                setCommissionTiers(rows);
                setCommissionTiersError(null);
              }}
              error={commissionTiersError}
            />
          </div>

          <div className="flex justify-center">
            <Button
              type="submit"
              variant="destructive"
              className="min-w-[300px]"
              disabled={updateCategoryMutation.isPending}
            >
              {updateCategoryMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Edit;
