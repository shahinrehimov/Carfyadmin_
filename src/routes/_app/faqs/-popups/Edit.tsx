import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useFaq, useUpdateFaq } from "@/lib/queries/faqs";
import { useTranslation } from "@/lib/utils/translationLoader";
import { useLangs } from "@/lib/queries/langs";
import { useQueryClient } from "@tanstack/react-query";

interface EditProps {
  faqId: number;
  onClose: () => void;
  onSaved?: () => void;
}

const hasHtmlContent = (html: string) =>
  html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim().length > 0;

const EditFormSchema = z.object({
  sort: z.number().min(0),
  translations: z.array(
    z.object({
      language_id: z.number(),
      question: z.string().min(1, "Question is required"),
      answer: z
        .string()
        .refine(hasHtmlContent, { message: "Answer is required" }),
    }),
  ),
});

type EditFormData = z.infer<typeof EditFormSchema>;

const Edit: React.FC<EditProps> = ({ faqId, onClose, onSaved }) => {
  const { t } = useTranslation();
  const { data: langs = [] } = useLangs();
  const { data: faq, isLoading } = useFaq(faqId);
  const queryClient = useQueryClient();

  const form = useForm<EditFormData>({
    resolver: zodResolver(EditFormSchema),
    defaultValues: {
      sort: 0,
      translations: [],
    },
  });

  useEffect(() => {
    if (faq && langs.length > 0) {
      form.reset({
        sort: faq.sort || 0,
        translations: langs.map((lang: { id: number }) => {
          const existing = faq.translations?.find(
            (tr) => tr.language_id === lang.id,
          );
          return {
            language_id: lang.id,
            question: existing?.question || "",
            answer: existing?.answer || "",
          };
        }),
      });
    }
  }, [faq, langs, form]);

  const updateFaqMutation = useUpdateFaq();

  const onSubmit = async (data: EditFormData) => {
    try {
      const response = await updateFaqMutation.mutateAsync({
        id: faqId,
        data: {
          sort: data.sort,
          translations: data.translations,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["faqs"] });
      toast.success(response.message || t("saved_successfully"));
      onSaved?.();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex w-full min-w-0 max-w-full justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("translations")}</h3>
            {langs.map((lang: { id: number; key: string }, index: number) => (
              <div key={lang.id} className="space-y-3 rounded-lg border p-4">
                <p className="text-sm font-medium text-gray-700">
                  {lang.key.toUpperCase()}
                </p>
                <FormField
                  control={form.control}
                  name={`translations.${index}.question`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("question")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("question")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`translations.${index}.answer`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("answer")}</FormLabel>
                      <RichTextEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        minHeight="200px"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </div>

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

          <div className="flex justify-center">
            <Button
              type="submit"
              variant="destructive"
              className="w-full max-w-md"
              disabled={updateFaqMutation.isPending}
            >
              {updateFaqMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Edit;
