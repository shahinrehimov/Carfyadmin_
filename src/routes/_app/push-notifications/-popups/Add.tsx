import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  useCreatePushNotification,
  useTargetingPreview,
} from "@/lib/queries/push-notifications";
import { useLangs } from "@/lib/queries/langs";
import { useTranslation } from "@/lib/utils/translationLoader";

interface AddProps {
  onClose: () => void;
}

const translationSchema = z.object({
  language_id: z.number(),
  title: z.string().min(1),
  body: z.string().min(1),
});

const schema = z.object({
  target_type: z.enum(["bulk", "individual"]),
  user_ids: z.string().optional(),
  bulk_filter_type: z.enum(["all", "company_id", "recent_buyers_days", "cart_abandoners_days", "inactive_days"]),
  bulk_filter_value: z.string().optional(),
  channels: z.object({
    in_app: z.boolean(),
    push: z.boolean(),
    sms: z.boolean(),
    email: z.boolean(),
  }),
  action_type: z.enum(["none", "order", "product", "category", "url"]),
  action_id: z.string().optional(),
  scheduled_at: z.string().optional(),
  use_schedule: z.boolean(),
  translations: z.array(translationSchema).min(1),
});

type FormData = z.infer<typeof schema>;

const Add: React.FC<AddProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { data: langs = [] } = useLangs();
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const TARGET_TYPE_OPTIONS = [
    { value: "bulk",       label: t("target_bulk") },
    { value: "individual", label: t("target_individual_label") },
  ];

  const BULK_FILTER_OPTIONS = [
    { value: "all",                  label: t("filter_all_users") },
    { value: "company_id",           label: t("filter_company_id") },
    { value: "recent_buyers_days",   label: t("filter_recent_buyers") },
    { value: "cart_abandoners_days", label: t("filter_cart_abandoners") },
    { value: "inactive_days",        label: t("filter_inactive") },
  ];

  const ACTION_TYPE_OPTIONS = [
    { value: "none",     label: t("action_none") },
    { value: "order",    label: t("action_order") },
    { value: "product",  label: t("action_product") },
    { value: "category", label: t("action_category") },
    { value: "url",      label: t("action_url") },
  ];

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      target_type: "bulk",
      bulk_filter_type: "all",
      bulk_filter_value: "",
      user_ids: "",
      channels: { in_app: true, push: true, sms: false, email: false },
      action_type: "none",
      action_id: "",
      scheduled_at: "",
      use_schedule: false,
      translations: [],
    },
  });

  useEffect(() => {
    if (langs.length > 0) {
      form.reset({
        target_type: "bulk",
        bulk_filter_type: "all",
        bulk_filter_value: "",
        user_ids: "",
        channels: { in_app: true, push: true, sms: false, email: false },
        action_type: "none",
        action_id: "",
        scheduled_at: "",
        use_schedule: false,
        translations: langs.map((lang: any) => ({
          language_id: lang.id,
          title: "",
          body: "",
        })),
      });
    }
  }, [langs]);

  const { fields } = useFieldArray({ control: form.control, name: "translations" });
  const createMutation = useCreatePushNotification();
  const previewMutation = useTargetingPreview();

  const targetType = form.watch("target_type");
  const bulkFilterType = form.watch("bulk_filter_type");
  const actionType = form.watch("action_type");
  const useSchedule = form.watch("use_schedule");

  const handlePreview = async () => {
    const bulkFilterValue = form.getValues("bulk_filter_value");
    let target_filters: Record<string, unknown> | null = null;
    if (targetType === "bulk" && bulkFilterType !== "all") {
      target_filters = { [bulkFilterType]: Number(bulkFilterValue) || bulkFilterValue };
    }
    try {
      const result = await previewMutation.mutateAsync({ target_type: targetType, target_filters });
      setPreviewCount(result.count);
    } catch {
      toast.error(t("failed_to_load_preview"));
    }
  };

  const onSubmit = async (data: FormData) => {
    const channels = Object.entries(data.channels)
      .filter(([, v]) => v)
      .map(([k]) => k) as string[];

    if (channels.length === 0) {
      toast.error(t("select_at_least_one_channel"));
      return;
    }

    let target_filters: Record<string, unknown> | null = null;
    if (data.target_type === "individual") {
      const ids = (data.user_ids ?? "").split(",").map((s) => Number(s.trim())).filter(Boolean);
      target_filters = { user_ids: ids };
    } else if (data.bulk_filter_type !== "all") {
      target_filters = { [data.bulk_filter_type]: Number(data.bulk_filter_value) || data.bulk_filter_value };
    }

    try {
      const response = await createMutation.mutateAsync({
        target_type: data.target_type,
        target_filters,
        channels: channels as any,
        action_type: data.action_type,
        action_id: data.action_id || null,
        scheduled_at: data.use_schedule && data.scheduled_at ? data.scheduled_at : null,
        translations: data.translations,
      });
      toast.success(response?.message || t("saved_successfully"));
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  return (
    <div className="w-full min-w-0 max-w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* Translations */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">{t("notification_text")}</h3>
            {fields.map((field, i) => {
              const lang = langs[i] as any;
              return (
                <div key={field.id} className="rounded-lg border p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {lang?.title ?? lang?.key?.toUpperCase()}
                  </p>
                  <FormField
                    control={form.control}
                    name={`translations.${i}.title`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>{t("title")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("notification_title_placeholder")} {...f} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`translations.${i}.body`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>{t("body")}</FormLabel>
                        <FormControl>
                          <Textarea placeholder={t("notification_body_placeholder")} rows={2} {...f} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              );
            })}
          </div>

          {/* Target */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">{t("target")}</h3>
            <FormField
              control={form.control}
              name="target_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("target_type")}</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={(val) => { field.onChange(val); setPreviewCount(null); }}
                      options={TARGET_TYPE_OPTIONS}
                      placeholder={t("select")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {targetType === "bulk" && (
              <>
                <FormField
                  control={form.control}
                  name="bulk_filter_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("filter_strategy")}</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(val) => { field.onChange(val); setPreviewCount(null); }}
                          options={BULK_FILTER_OPTIONS}
                          placeholder={t("select")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {bulkFilterType !== "all" && (
                  <FormField
                    control={form.control}
                    name="bulk_filter_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {bulkFilterType === "company_id" ? t("company_id") : t("days_count")}
                        </FormLabel>
                        <FormControl>
                          <Input type="number" placeholder={bulkFilterType === "company_id" ? "5" : "30"} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            {targetType === "individual" && (
              <FormField
                control={form.control}
                name="user_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("user_ids_comma_separated")}</FormLabel>
                    <FormControl>
                      <Input placeholder="1, 2, 3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" size="sm"
                onClick={handlePreview} disabled={previewMutation.isPending}>
                {previewMutation.isPending
                  ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  : <Users className="mr-2 h-3.5 w-3.5" />}
                {t("preview_target_count")}
              </Button>
              {previewCount !== null && (
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  <span className="font-bold text-primary">{previewCount}</span>{" "}
                  {t("users_will_receive")}
                </span>
              )}
            </div>
          </div>

          {/* Channels */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">{t("channels")}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(["in_app", "push", "sms", "email"] as const).map((ch) => (
                <FormField key={ch} control={form.control} name={`channels.${ch}`}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2 rounded-lg border p-3">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="cursor-pointer font-normal uppercase text-xs">{ch}</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>

          {/* Action */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">{t("tap_action")}</h3>
            <FormField
              control={form.control}
              name="action_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("action_type")}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}
                      options={ACTION_TYPE_OPTIONS} placeholder={t("select")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {actionType !== "none" && (
              <FormField
                control={form.control}
                name="action_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {actionType === "order"    && t("order_uuid")}
                      {actionType === "product"  && t("product_slug")}
                      {actionType === "category" && t("category_slug")}
                      {actionType === "url"      && "URL"}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Schedule */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">{t("scheduling")}</h3>
            <FormField
              control={form.control}
              name="use_schedule"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="cursor-pointer">
                      {t("scheduled_send")}
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            {useSchedule && (
              <FormField
                control={form.control}
                name="scheduled_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("send_time")}</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className="flex justify-center">
            <Button type="submit" variant="destructive" className="w-full max-w-md"
              disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("create_notification")
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Add;
