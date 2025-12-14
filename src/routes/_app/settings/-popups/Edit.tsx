import React, { useEffect, useState } from "react";
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
import { useSetting, useUpdateSetting } from "@/lib/queries/settings";
import { useTranslation } from "@/lib/utils/translationLoader";

const EditFormSchema = z.object({
  type: z.enum(["string", "file"]),
  value: z.string().optional(),
});

type EditFormData = z.infer<typeof EditFormSchema>;

const Edit: React.FC<{ settingKey: string; onClose: () => void }> = ({ settingKey, onClose }) => {
  const { t } = useTranslation();
  const { data: setting, isLoading } = useSetting(settingKey);
  const [file, setFile] = useState<File | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [existingFile, setExistingFile] = useState<string>("");

  const form = useForm<EditFormData>({
    resolver: zodResolver(EditFormSchema),
    defaultValues: { type: "string", value: "" },
  });
  const updateSettingMutation = useUpdateSetting();
  const typeValue = form.watch("type");

  useEffect(() => {
    if (setting) {
      form.reset({ type: setting.type as "string" | "file", value: setting.value });
      if (setting.type === "file") {
        setExistingFile(setting.value);
        const videoExtensions = ["mp4", "avi", "mov", "wmv", "flv", "webm"];
        const isVideoFile = videoExtensions.includes(
          setting.value.split(".").pop()?.toLowerCase() || ""
        );
        setIsVideo(isVideoFile);
      }
    }
  }, [setting, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const onSubmit = async (data: EditFormData) => {
    try {
      const formData = new FormData();
      formData.append("type", data.type);

      if (data.type === "file") {
        if (!file && !existingFile) {
          toast.error(t("select_file"));
          return;
        }
        if (file) {
          formData.append("file", file);
        }
      } else {
        if (!data.value) {
          toast.error(t("value_is_required"));
          return;
        }
        formData.append("value", data.value);
      }

      const response = await updateSettingMutation.mutateAsync({
        key: settingKey,
        data: formData,
      });
      toast.success(response.message || t("setting_updated_successfully"));
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
          <div>
            <Label>{t("key")}</Label>
            <Input value={settingKey} disabled className="mt-2" />
          </div>
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
                    options={[
                      { value: "string", label: "Text" },
                      { value: "file", label: "File" },
                    ]}
                    disabled
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
              {existingFile && (
                <div>
                  <Label>{t("current_file")}</Label>
                  {isVideo ? (
                    <video
                      src={existingFile}
                      className="mt-2 h-32 w-32 rounded object-cover"
                      controls
                    />
                  ) : (
                    <img
                      src={existingFile}
                      alt="Current"
                      className="mt-2 h-32 w-32 rounded object-cover"
                    />
                  )}
                </div>
              )}
              <div>
                <Label>{t("upload_new_file")}</Label>
                <Input
                  type="file"
                  accept={isVideo ? "video/*" : "image/*"}
                  onChange={handleFileChange}
                  className="mt-2"
                />
              </div>
              {previewUrl && !isVideo && (
                <div>
                  <Label>{t("preview")}</Label>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="mt-2 h-32 w-32 rounded object-cover"
                  />
                </div>
              )}
            </div>
          ) : null}
          <div className="flex justify-center">
            <Button
              type="submit"
              variant="destructive"
              className="min-w-[300px]"
              disabled={updateSettingMutation.isPending}
            >
              {updateSettingMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Edit;
