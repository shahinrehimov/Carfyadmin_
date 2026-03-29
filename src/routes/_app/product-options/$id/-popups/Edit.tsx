import React, { useEffect } from "react";
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
import { useProductOptionItem, useUpdateProductOptionItem } from "@/lib/queries/product-options";
import { useTranslation } from "@/lib/utils/translationLoader";
import { useLangs } from "@/lib/queries/langs";

interface EditProps {
  productOptionId: number;
  itemId: number;
  onClose: () => void;
}

const EditFormSchema = z.object({
  translations: z.array(
    z.object({
      language_id: z.number(),
      title: z.string().min(1, "Title is required"),
    })
  ),
});

type EditFormData = z.infer<typeof EditFormSchema>;

const Edit: React.FC<EditProps> = ({ productOptionId, itemId, onClose }) => {
  const { t } = useTranslation();
  const { data: langs = [] } = useLangs();
  const { data: item, isLoading } = useProductOptionItem(productOptionId, itemId);
  const updateMutation = useUpdateProductOptionItem();

  const form = useForm<EditFormData>({
    resolver: zodResolver(EditFormSchema),
    defaultValues: { translations: [] },
  });

  useEffect(() => {
    if (item && langs.length > 0) {
      const data = item as any;
      form.reset({
        translations:
          data.translations?.map((tr: any) => ({
            language_id: tr.language_id,
            title: tr.title,
          })) || langs.map((lang: any) => ({ language_id: lang.id, title: "" })),
      });
    }
  }, [item, langs, form]);

  const onSubmit = async (data: EditFormData) => {
    try {
      const response = await updateMutation.mutateAsync({ productOptionId, id: itemId, data });
      toast.success(response.message || t("updated_successfully"));
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex w-full min-w-0 max-w-full justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

          <div className="flex justify-center">
            <Button
              type="submit"
              variant="destructive"
              className="w-full max-w-md"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Edit;
