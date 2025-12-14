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
import {
  useAddressType,
  useUpdateAddressType,
} from "@/lib/queries/address-types";
import { useTranslation } from "@/lib/utils/translationLoader";
import { useLangs } from "@/lib/queries/langs";

const EditFormSchema = z.object({
  translations: z.array(
    z.object({
      language_id: z.number(),
      title: z.string().min(1, "Title is required"),
    }),
  ),
});

type EditFormData = z.infer<typeof EditFormSchema>;

const Edit: React.FC<{ addressTypeId: number; onClose: () => void }> = ({
  addressTypeId,
  onClose,
}) => {
  const { t } = useTranslation();
  const { data: langs = [] } = useLangs();
  const { data: addressType, isLoading } = useAddressType(addressTypeId);
  const form = useForm<EditFormData>({
    resolver: zodResolver(EditFormSchema),
    defaultValues: {
      translations: [],
    },
  });
  const updateAddressTypeMutation = useUpdateAddressType();

  useEffect(() => {
    if (addressType && langs.length > 0) {
      const addressTypeData = addressType as any;
      form.reset({
        translations:
          addressTypeData.translations?.map((translation: any) => ({
            language_id: translation.language_id,
            title: translation.title,
          })) ||
          langs.map((lang: any) => ({
            language_id: lang.id,
            title: "",
          })),
      });
    }
  }, [addressType, langs, form]);

  const onSubmit = async (data: EditFormData) => {
    try {
      const response = await updateAddressTypeMutation.mutateAsync({
        id: addressTypeId,
        data,
      });
      toast.success(response.message || t("address_type_updated_successfully"));
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
              disabled={updateAddressTypeMutation.isPending}
            >
              {updateAddressTypeMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Edit;
