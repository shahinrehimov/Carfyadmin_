import React, { useEffect, useState } from "react";
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
import ImageUploader from "@/components/ui/image-uploader";

interface EditProps {
  socialId: number;
  onClose: () => void;
}

const EditFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Must be a valid URL"),
});

type EditFormData = z.infer<typeof EditFormSchema>;

const Edit: React.FC<EditProps> = ({ socialId, onClose }) => {
  const { t } = useTranslation();
  const { data: social, isLoading } = useSocial(socialId);
  const [file, setFile] = useState<{
    file?: File | null | string;
    preview?: string;
  }>({});

  const form = useForm<EditFormData>({
    resolver: zodResolver(EditFormSchema),
    defaultValues: {
      title: "",
      url: "",
    },
  });

  useEffect(() => {
    if (social) {
      form.reset({
        title: social.title,
        url: social.url,
      });

      if (social.image) {
        setFile({ file: social.image, preview: social.image });
      }
    }
  }, [social, form]);

  const updateSocialMutation = useUpdateSocial();

  const onSubmit = async (data: EditFormData) => {
    try {
      const response = await updateSocialMutation.mutateAsync({
        id: socialId,
        data: {
          title: data.title,
          url: data.url,
          image: file.file instanceof File ? file.file : undefined,
        },
      });
      toast.success(response.message || t("social_updated_successfully"));
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-w-0 max-w-full py-12">
        <div className="flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("title")}</FormLabel>
                <FormControl>
                  <Input placeholder="facebook" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("link")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://facebook.com/yourpage"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("image")}</h3>
            <ImageUploader file={file} setFile={setFile} />
          </div>

          <div className="flex justify-center">
            <Button
              type="submit"
              variant="default"
              className="w-full max-w-md"
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
