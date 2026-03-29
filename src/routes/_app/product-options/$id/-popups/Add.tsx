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
import { useCreateProductOptionItem } from "@/lib/queries/product-options";
import { useTranslation } from "@/lib/utils/translationLoader";
import { useLangs } from "@/lib/queries/langs";

interface AddProps {
  productOptionId: number;
  onClose: () => void;
}

const AddFormSchema = z.object({
  translations: z.array(
    z.object({
      language_id: z.number(),
      title: z.string().min(1, "Title is required"),
    })
  ),
});

type AddFormData = z.infer<typeof AddFormSchema>;

const Add: React.FC<AddProps> = ({ productOptionId, onClose }) => {
  const { t } = useTranslation();
  const { data: langs = [] } = useLangs();
  const createMutation = useCreateProductOptionItem();

  const form = useForm<AddFormData>({
    resolver: zodResolver(AddFormSchema),
    defaultValues: { translations: [] },
  });

  useEffect(() => {
    if (langs.length > 0) {
      form.reset({
        translations: langs.map((lang: any) => ({ language_id: lang.id, title: "" })),
      });
    }
  }, [langs, form]);

  const onSubmit = async (data: AddFormData) => {
    try {
      const response = await createMutation.mutateAsync({ productOptionId, data });
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
