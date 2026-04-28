import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  useAdvertisement,
  useUpdateAdvertisement,
} from "@/lib/queries/advertisements";
import { useTranslation } from "@/lib/utils/translationLoader";
import ImageUploader from "@/components/ui/image-uploader";

interface EditProps {
  advertisementId: number;
  onClose: () => void;
}

const EditFormSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(255),
    description: z.string().optional(),
    link: z.string().url("Must be a valid URL (https://...)"),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    is_active: z.boolean(),
    platform: z.enum(["site", "app", "both"]),
  })
  .refine((data) => data.end_date > data.start_date, {
    message: "End date must be after start date",
    path: ["end_date"],
  });

type EditFormData = z.infer<typeof EditFormSchema>;

const PLATFORM_OPTIONS = [
  { value: "site", label: "Site" },
  { value: "app", label: "App" },
  { value: "both", label: "Both" },
];

const Edit: React.FC<EditProps> = ({ advertisementId, onClose }) => {
  const { t } = useTranslation();
  const { data: advertisement, isLoading } =
    useAdvertisement(advertisementId);
  const [file, setFile] = useState<{
    file?: File | null | string;
    preview?: string;
  }>({});

  const form = useForm<EditFormData>({
    resolver: zodResolver(EditFormSchema),
    defaultValues: {
      title: "",
      description: "",
      link: "",
      start_date: "",
      end_date: "",
      is_active: false,
      platform: "both",
    },
  });

  useEffect(() => {
    if (advertisement) {
      form.reset({
        title: advertisement.title || "",
        description: advertisement.description || "",
        link: advertisement.link || "",
        start_date: advertisement.start_date || "",
        end_date: advertisement.end_date || "",
        is_active: advertisement.is_active ?? false,
        platform:
          (advertisement.platform as "site" | "app" | "both") || "both",
      });

      if (advertisement.image_url) {
        setFile({
          file: advertisement.image_url,
          preview: advertisement.image_url,
        });
      }
    }
  }, [advertisement, form]);

  const updateMutation = useUpdateAdvertisement();

  const onSubmit = async (data: EditFormData) => {
    try {
      const response = await updateMutation.mutateAsync({
        id: advertisementId,
        data: {
          title: data.title,
          description: data.description,
          link: data.link,
          start_date: data.start_date,
          end_date: data.end_date,
          is_active: data.is_active ? 1 : 0,
          platform: data.platform,
          image: file.file instanceof File ? file.file : undefined,
        },
      });
      toast.success(
        response?.data?.message || response?.message || t("saved_successfully"),
      );
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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("general")}</h3>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("title")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("title")} {...field} />
                  </FormControl>
                  <p className="text-sm text-gray-500">
                    {t("key_auto_updated_from_title")}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("description")}{" "}
                    <span className="text-gray-400">({t("optional")})</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("internal_note")}
                      rows={3}
                      {...field}
                    />
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
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("image")}</h3>
            <ImageUploader file={file} setFile={setFile} />
            <p className="text-sm text-gray-500">
              {t("leave_empty_to_keep_current_image")}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("settings")}</h3>

            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("platform")}</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      options={PLATFORM_OPTIONS}
                      placeholder={t("select_platform")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("start_date")}</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t("pick_date")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("end_date")}</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t("pick_date")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">
                      {t("active")}
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
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
