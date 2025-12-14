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
import { useSocial, useUpdateSocial } from "@/lib/queries/socials";
import { useTranslation } from "@/lib/utils/translationLoader";

interface EditProps {
  socialId: number;
  onClose: () => void;
}

const EditFormSchema = z.object({
  key: z.string().min(1, "Key is required"),
  link: z.string().url("Must be a valid URL"),
});

type EditFormData = z.infer<typeof EditFormSchema>;

const Edit: React.FC<EditProps> = ({ socialId, onClose }) => {
  const { t } = useTranslation();
  const { data: social, isLoading } = useSocial(socialId);

  const form = useForm<EditFormData>({
    resolver: zodResolver(EditFormSchema),
    defaultValues: {
      key: "",
      link: "",
    },
  });

  useEffect(() => {
    if (social) {
      form.reset({
        key: social.key,
        link: social.link,
      });
    }
  }, [social, form]);

  const updateSocialMutation = useUpdateSocial();

  const onSubmit = async (data: EditFormData) => {
    try {
      const response = await updateSocialMutation.mutateAsync({
        id: socialId,
        data,
      });
      toast.success(response.message || t("social_updated_successfully"));
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl min-w-[300px] py-12 md:min-w-[650px]">
        <div className="flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

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
              disabled={updateSocialMutation.isPending}
            >
              {updateSocialMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Edit;
