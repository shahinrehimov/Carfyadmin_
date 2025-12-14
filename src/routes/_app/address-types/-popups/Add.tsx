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
import { useCreateAddressType } from "@/lib/queries/address-types";
import { useTranslation } from "@/lib/utils/translationLoader";
import { useLangs } from "@/lib/queries/langs";

const AddFormSchema = z.object({
  translations: z.array(
    z.object({
      language_id: z.number(),
      title: z.string().min(1, "Title is required"),
    }),
  ),
});

type AddFormData = z.infer<typeof AddFormSchema>;

const Add: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  const { data: langs = [] } = useLangs();
  const form = useForm<AddFormData>({
    resolver: zodResolver(AddFormSchema),
    defaultValues: {
      translations: [],
    },
  });

  // Update translations when langs data is loaded
  useEffect(() => {
    if (langs.length > 0) {
      form.reset({
        translations: langs.map((lang: any) => ({
          language_id: lang.id,
          title: "",
        })),
      });
    }
  }, [langs, form]);

  const createAddressTypeMutation = useCreateAddressType();

  const onSubmit = async (data: AddFormData) => {
    try {
      const response = await createAddressTypeMutation.mutateAsync(data);
      toast.success(response.message || t("address_type_created_successfully"));
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  return (
    <div className="w-full max-w-2xl min-w-[300px] md:min-w-[650px]">
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
                      <Input {...field} />
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
              className="min-w-[300px]"
              disabled={createAddressTypeMutation.isPending}
            >
              {createAddressTypeMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Add;
