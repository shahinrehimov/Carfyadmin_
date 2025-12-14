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
import { useCreateSocial } from "@/lib/queries/socials";
import { useTranslation } from "@/lib/utils/translationLoader";

interface AddProps {
  onClose: () => void;
}

const AddFormSchema = z.object({
  key: z.string().min(1, "Key is required"),
  link: z.string().url("Must be a valid URL"),
});

type AddFormData = z.infer<typeof AddFormSchema>;

const Add: React.FC<AddProps> = ({ onClose }) => {
  const { t } = useTranslation();

  const form = useForm<AddFormData>({
    resolver: zodResolver(AddFormSchema),
    defaultValues: {
      key: "",
      link: "",
    },
  });

  const createSocialMutation = useCreateSocial();

  const onSubmit = async (data: AddFormData) => {
    try {
      const response = await createSocialMutation.mutateAsync(data);
      toast.success(response.message || t("social_created_successfully"));
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  return (
    <div className="w-full max-w-2xl min-w-[300px] md:min-w-[650px]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("key")}</FormLabel>
                <FormControl>
                  <Input placeholder="facebook" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="link"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("link")}</FormLabel>
                <FormControl>
                  <Input placeholder="https://facebook.com/yourpage" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-center">
            <Button
              type="submit"
              variant="destructive"
              className="min-w-[300px]"
              disabled={createSocialMutation.isPending}
            >
              {createSocialMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Add;
