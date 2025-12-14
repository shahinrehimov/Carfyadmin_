import React from "react";
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
import { useCreateLanguage } from "@/lib/queries/languages";
import { useTranslation } from "@/lib/utils/translationLoader";

interface AddProps {
  onClose: () => void;
}

const AddFormSchema = z.object({
  key: z.string().min(1, "Key is required"),
  title: z.string().min(1, "Title is required"),
});

type AddFormData = z.infer<typeof AddFormSchema>;

const Add: React.FC<AddProps> = ({ onClose }) => {
  const { t } = useTranslation();

  const form = useForm<AddFormData>({
    resolver: zodResolver(AddFormSchema),
    defaultValues: {
      key: "",
      title: "",
    },
  });

  const createLanguageMutation = useCreateLanguage();

  const onSubmit = async (data: AddFormData) => {
    try {
      const response = await createLanguageMutation.mutateAsync(data);
      toast.success(response.message);
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "An error occurred");
    }
  };

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
              disabled={createLanguageMutation.isPending}
            >
              {createLanguageMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Add;
