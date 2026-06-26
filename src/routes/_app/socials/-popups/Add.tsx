import React, { useState } from "react";
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
import ImageUploader from "@/components/ui/image-uploader";

interface AddProps {
  onClose: () => void;
}

const AddFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Must be a valid URL"),
});

type AddFormData = z.infer<typeof AddFormSchema>;

const Add: React.FC<AddProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<{
    file?: File | null | string;
    preview?: string;
  }>({});

  const form = useForm<AddFormData>({
    resolver: zodResolver(AddFormSchema),
    defaultValues: {
      title: "",
      url: "",
    },
  });

  const createSocialMutation = useCreateSocial();

  const onSubmit = async (data: AddFormData) => {
    if (!file.file || typeof file.file === "string") {
      toast.error(t("image_is_required"));
      return;
    }

    try {
      const response = await createSocialMutation.mutateAsync({
        title: data.title,
        url: data.url,
        image: file.file,
      });
      toast.success(response.message || t("social_created_successfully"));
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

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
