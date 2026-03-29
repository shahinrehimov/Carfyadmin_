import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCreateProductOption } from "@/lib/queries/product-options";
import { useTranslation } from "@/lib/utils/translationLoader";
import { useLangs } from "@/lib/queries/langs";

interface AddProps {
  onClose: () => void;
}

const AddFormSchema = z.object({
  translations: z.array(
    z.object({
      language_id: z.number(),
      title: z.string().min(1, "Title is required"),
    })
  ),
  is_required: z.boolean(),
  has_items: z.boolean(),
  is_translatable: z.boolean(),
  can_multiple: z.boolean(),
});

type AddFormData = z.infer<typeof AddFormSchema>;

const Add: React.FC<AddProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { data: langs = [] } = useLangs();
  const createMutation = useCreateProductOption();

  const form = useForm<AddFormData>({
    resolver: zodResolver(AddFormSchema),
    defaultValues: {
      translations: [],
      is_required: false,
      has_items: false,
      is_translatable: false,
      can_multiple: false,
    },
  });

  useEffect(() => {
    if (langs.length > 0) {
      form.reset({
        translations: langs.map((lang: any) => ({ language_id: lang.id, title: "" })),
        is_required: false,
        has_items: false,
        is_translatable: false,
        can_multiple: false,
      });
    }
  }, [langs, form]);

  const onSubmit = async (data: AddFormData) => {
    try {
      const response = await createMutation.mutateAsync(data);
      toast.success(response.message || t("created_successfully"));
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

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

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("settings")}</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="is_required"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">{t("is_required")}</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="has_items"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">{t("has_items")}</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_translatable"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">
                      {t("is_translatable")}
                    </FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="can_multiple"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">{t("can_multiple")}</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              type="submit"
              variant="destructive"
              className="w-full max-w-md"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Add;
