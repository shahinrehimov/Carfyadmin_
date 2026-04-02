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
import { useCarColor, useUpdateCarColor } from "@/lib/queries/car-colors";
import { useTranslation } from "@/lib/utils/translationLoader";
import { useLangs } from "@/lib/queries/langs";

const EditFormSchema = z.object({
  hex_code: z
    .string()
    .min(1, "Color is required")
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  sort: z.number().min(0),
  translations: z.array(
    z.object({
      language_id: z.number(),
      title: z.string().min(1, "Title is required"),
    }),
  ),
});

type EditFormData = z.infer<typeof EditFormSchema>;

const Edit: React.FC<{ colorId: number; onClose: () => void }> = ({
  colorId,
  onClose,
}) => {
  const { t } = useTranslation();
  const { data: langs = [] } = useLangs();
  const { data: carColor, isLoading } = useCarColor(colorId);
  const updateMutation = useUpdateCarColor();

  const form = useForm<EditFormData>({
    resolver: zodResolver(EditFormSchema),
    defaultValues: {
      hex_code: "#000000",
      sort: 0,
      translations: [],
    },
  });

  useEffect(() => {
    if (carColor && langs.length > 0) {
      form.reset({
        hex_code: (carColor as any).hex_code || "#000000",
        sort: (carColor as any).sort || 0,
        translations:
          (carColor as any).translations?.map((tr: any) => ({
            language_id: tr.language_id,
            title: tr.title || "",
          })) ||
          langs.map((lang: any) => ({
            language_id: lang.id,
            title: "",
          })),
      });
    }
  }, [carColor, langs, form]);

  const onSubmit = async (data: EditFormData) => {
    try {
      const response = await updateMutation.mutateAsync({ id: colorId, data });
      toast.success(response.message || t("saved_successfully"));
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
          {/* Titles */}
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

          {/* Color & Sort */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("settings")}</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hex_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("color")}</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="h-10 w-12 cursor-pointer rounded border p-1"
                        />
                        <Input
                          {...field}
                          placeholder="#000000"
                          className="font-mono uppercase"
                          maxLength={7}
                        />
                      </div>
                    </FormControl>
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
                        placeholder="0"
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
