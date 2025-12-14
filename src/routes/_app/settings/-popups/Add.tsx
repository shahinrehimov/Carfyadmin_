import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCreateSetting } from "@/lib/queries/settings";
import { useTranslation } from "@/lib/utils/translationLoader";

const AddFormSchema = z.object({
  key: z.string().min(1, "Key is required"),
  type: z.enum(["string", "file"]),
  value: z.string().optional(),
});

type AddFormData = z.infer<typeof AddFormSchema>;

const Add: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const form = useForm<AddFormData>({
    resolver: zodResolver(AddFormSchema),
    defaultValues: { key: "", type: "string", value: "" },
  });
  const createSettingMutation = useCreateSetting();
  const typeValue = form.watch("type");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const onSubmit = async (data: AddFormData) => {
    try {
      const formData = new FormData();
      formData.append("key", data.key);
      formData.append("type", data.type);

      if (data.type === "file") {
        if (!file) {
          toast.error(t("select_file"));
          return;
        }
        formData.append("file", file);
      } else {
        if (!data.value) {
          toast.error(t("value_is_required"));
          return;
        }
        formData.append("value", data.value);
      }

      const response = await createSettingMutation.mutateAsync(formData);
      toast.success(response.message || t("setting_created_successfully"));
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
                  <Input placeholder={t("key")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("type")}</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={t("select_type")}
                    options={[
                      { value: "string", label: "Text" },
                      { value: "file", label: "File" },
                    ]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {typeValue === "string" ? (
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("value")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("value")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : typeValue === "file" ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="video-mode" checked={isVideo} onCheckedChange={setIsVideo} />
                <Label htmlFor="video-mode">{isVideo ? t("video") : t("image")}</Label>
              </div>
              <div>
                <Label>{isVideo ? t("video") : t("image")}</Label>
                <Input
                  type="file"
                  accept={isVideo ? "video/*" : "image/*"}
                  onChange={handleFileChange}
                  className="mt-2"
                />
              </div>
              {previewUrl && !isVideo && (
                <img src={previewUrl} alt="Preview" className="h-32 w-32 rounded object-cover" />
              )}
            </div>
          ) : null}
          <div className="flex justify-center">
            <Button
              type="submit"
              variant="destructive"
              className="min-w-[300px]"
              disabled={createSettingMutation.isPending}
            >
              {createSettingMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Add;
