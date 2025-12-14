import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useMeta, useUpdateMeta } from "@/lib/queries/meta";
import { useTranslation } from "@/lib/utils/translationLoader";
import { useLangs } from "@/lib/queries/langs";

const EditFormSchema = z.object({
  page_title: z.string().min(1, "Title is required"),
  page_key: z.string().min(1, "Key is required"),
  translations: z.array(
    z.object({
      language_id: z.number(),
      title: z.string().min(1, "Title is required"),
      keywords: z.string().optional(),
      description: z.string().optional(),
    }),
  ),
});

type EditFormData = z.infer<typeof EditFormSchema>;

const Edit: React.FC<{ metaId: number; onClose: () => void }> = ({
  metaId,
  onClose,
}) => {
  const { t } = useTranslation();
  const { data: langs = [] } = useLangs();
  const { data: meta, isLoading } = useMeta(metaId);
  const form = useForm<EditFormData>({
    resolver: zodResolver(EditFormSchema),
    defaultValues: {
      page_title: "",
      page_key: "",
      translations: langs.map((lang: any) => ({
        language_id: lang.id,
        title: "",
        keywords: "",
        description: "",
      })),
    },
  });
  const updateMetaMutation = useUpdateMeta();

  useEffect(() => {
    if (meta) {
      form.reset({
        page_title: meta.page_title || "",
        page_key: meta.page_key || "",
        translations: langs.map((lang: any) => {
          const translation = meta.translations?.find(
            (t: any) => t.language_id === lang.id,
          );
          return {
            language_id: lang.id,
            title: translation?.title || "",
            keywords: translation?.keywords || "",
            description: translation?.description || "",
          };
        }),
      });
    }
  }, [meta, langs, form]);

  const onSubmit = async (data: EditFormData) => {
    try {
      const requestData = {
        page: data.page_key,
        translations: data.translations,
      };
      const response = await updateMetaMutation.mutateAsync({
        id: metaId,
        data: requestData,
      });
      toast.success(response.message || t("meta_updated_successfully"));
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  if (isLoading)
    return (
      <div className="w-full max-w-2xl min-w-[300px] py-12 md:min-w-[650px]">
        <div className="flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
        </div>
      </div>
    );

  return (
    <div className="w-full max-w-2xl min-w-[300px] md:min-w-[650px]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="page_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("title")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="page_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("key")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {langs.map((lang: any, index: number) => (
            <div key={lang.id} className="space-y-4 rounded-lg border p-4">
              <h3 className="text-sm font-medium">{lang.key}</h3>
              <FormField
                control={form.control}
                name={`translations.${index}.title`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("title")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`translations.${index}.keywords`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("keywords")}</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`translations.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description")}</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
          <div className="flex justify-center">
            <Button
              type="submit"
              variant="destructive"
              className="min-w-[300px]"
              disabled={updateMetaMutation.isPending}
            >
              {updateMetaMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Edit;
