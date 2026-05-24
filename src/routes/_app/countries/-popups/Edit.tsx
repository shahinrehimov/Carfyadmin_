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
import { useCountry, useUpdateCountry } from "@/lib/queries/countries";
import { useTranslation } from "@/lib/utils/translationLoader";
import { useLangs } from "@/lib/queries/langs";

const FormSchema = z.object({
  translations: z.array(
    z.object({
      language_id: z.number(),
      title: z.string().min(1, "Title is required"),
    }),
  ),
});

type FormData = z.infer<typeof FormSchema>;

const Edit: React.FC<{ countryId: number; onClose: () => void }> = ({
  countryId,
  onClose,
}) => {
  const { t } = useTranslation();
  const { data: langs = [] } = useLangs();
  const { data: country, isLoading } = useCountry(countryId);
  const updateMutation = useUpdateCountry();

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: { translations: [] },
  });

  useEffect(() => {
    if (country && langs.length > 0) {
      form.reset({
        translations:
          country.translations?.map((tr) => ({
            language_id: tr.language_id,
            title: tr.title || "",
          })) ||
          langs.map((lang: { id: number }) => ({
            language_id: lang.id,
            title: "",
          })),
      });
    }
  }, [country, langs, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const response = await updateMutation.mutateAsync({
        id: countryId,
        data,
      });
      toast.success(response.message || t("saved_successfully"));
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t("an_error_occurred"));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-6 animate-pulse rounded bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("titles")}</h3>
            {langs.map((lang: { id: number; key: string }, index: number) => (
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
