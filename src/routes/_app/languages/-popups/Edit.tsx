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
import { useLanguage, useUpdateLanguage } from "@/lib/queries/languages";
import { useTranslation } from "@/lib/utils/translationLoader";

interface EditProps {
  languageId: number;
  onClose: () => void;
}

const EditFormSchema = z.object({
  key: z.string().min(1, "Key is required"),
  title: z.string().min(1, "Title is required"),
});

type EditFormData = z.infer<typeof EditFormSchema>;

const Edit: React.FC<EditProps> = ({ languageId, onClose }) => {
  const { t } = useTranslation();

  const form = useForm<EditFormData>({
    resolver: zodResolver(EditFormSchema),
    defaultValues: {
      key: "",
      title: "",
    },
  });

  const { data: language, isLoading: isLoadingLanguage } = useLanguage(languageId);
  const updateLanguageMutation = useUpdateLanguage();

  useEffect(() => {
    if (language) {
      form.reset({
        key: language.key,
        title: language.title,
      });
    }
  }, [language, form]);

  const onSubmit = async (data: EditFormData) => {
    try {
      const response = await updateLanguageMutation.mutateAsync({
        id: languageId,
        data,
      });
      toast.success(response.message);
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "An error occurred");
    }
  };

  if (isLoadingLanguage) {
    return (
      <div className="flex w-full max-w-2xl min-w-[300px] items-center justify-center p-8 md:min-w-[650px]">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl min-w-[300px] md:min-w-[650px]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key</FormLabel>
                  <FormControl>
                    <Input placeholder="Key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("title")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("add_new_language")} {...field} />
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
              className="min-w-[300px]"
              disabled={updateLanguageMutation.isPending}
            >
              {updateLanguageMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Edit;
