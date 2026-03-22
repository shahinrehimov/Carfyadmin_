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
import { useCreateBrand } from "@/lib/queries/brands";
import { useTranslation } from "@/lib/utils/translationLoader";
import { useLangs } from "@/lib/queries/langs";
import ImageUploader from "@/components/ui/image-uploader";

interface AddProps {
  onClose: () => void;
}

const AddFormSchema = z.object({
  slug: z.string().optional(),
  sort: z.number().min(0, "Sort must be 0 or greater"),
  translations: z.array(
    z.object({
      language_id: z.number(),
      title: z.string().min(1, "Title is required"),
    }),
  ),
});

type AddFormData = z.infer<typeof AddFormSchema>;

const Add: React.FC<AddProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { data: langs = [] } = useLangs();
  const [file, setFile] = useState<{
    file?: File | null | string;
    preview?: string;
  }>({});

  const form = useForm<AddFormData>({
    resolver: zodResolver(AddFormSchema),
    defaultValues: {
      slug: "",
      sort: 0,
      translations: [],
    },
  });

  // Update translations when langs data is loaded
  useEffect(() => {
    if (langs.length > 0) {
      form.reset({
        slug: "",
        sort: 0,
        translations: langs.map((lang: any) => ({
          language_id: lang.id,
          title: "",
        })),
      });
    }
  }, [langs, form]);

  const createBrandMutation = useCreateBrand();

  const onSubmit = async (data: AddFormData) => {
    if (!file.file || typeof file.file === "string") {
      toast.error(t("image_is_required"));
      return;
    }

    try {
      const response = await createBrandMutation.mutateAsync({
        translations: data.translations,
        slug: data.slug,
        sort: data.sort,
        image: file.file,
      });
      toast.success(response.message || t("brand_created_successfully"));
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  return (
    <div className="w-full min-w-0 max-w-full">
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
              className="w-full max-w-md"
              disabled={createBrandMutation.isPending}
            >
              {createBrandMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Add;
