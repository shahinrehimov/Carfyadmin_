import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
  useSyncNotificationSettings,
} from "@/lib/queries/push-notifications";
import { useTranslation } from "@/lib/utils/translationLoader";
import type { NotificationChannel } from "@/lib/types/push-notification";

export const Route = createFileRoute("/_app/notification-settings/")({
  component: RouteComponent,
});

const CHANNELS: NotificationChannel[] = ["in_app", "push", "sms", "email"];

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  in_app: "In-App",
  push:   "Push",
  sms:    "SMS",
  email:  "Email",
};

interface SettingRow {
  id: number;
  event_type: string;
  is_active: boolean;
  channels: NotificationChannel[];
}

function RouteComponent() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  const EVENT_TYPE_LABELS: Record<string, string> = {
    order_placed:         t("event_order_placed"),
    order_status_changed: t("event_order_status_changed"),
    order_cancelled:      t("event_order_cancelled"),
    order_delivered:      t("event_order_delivered"),
    order_item_cancelled: t("event_order_item_cancelled"),
  };

  const { data, isLoading, error } = useNotificationSettings();
  const updateMutation = useUpdateNotificationSettings();
  const syncMutation   = useSyncNotificationSettings();

  useEffect(() => {
    if (data?.data) {
      setSettings(
        data.data.map((s) => ({
          id: s.id,
          event_type: s.event_type,
          is_active: s.is_active,
          channels: [...s.channels] as NotificationChannel[],
        })),
      );
      setIsDirty(false);
    }
  }, [data]);

  const updateSetting = (
    id: number,
    key: "is_active" | "channels",
    value: boolean | NotificationChannel[],
  ) => {
    setSettings((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
    setIsDirty(true);
  };

  const toggleChannel = (id: number, channel: NotificationChannel) => {
    setSettings((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const has = s.channels.includes(channel);
        return { ...s, channels: has ? s.channels.filter((c) => c !== channel) : [...s.channels, channel] };
      }),
    );
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      const res = await updateMutation.mutateAsync(
        settings.map((s) => ({ id: s.id, is_active: s.is_active, channels: s.channels })),
      );
      toast.success(res.message || t("saved_successfully"));
      setIsDirty(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const handleSync = async () => {
    try {
      const res = await syncMutation.mutateAsync();
      toast.success(
        res.added > 0
          ? t("new_event_types_synced").replace("{count}", String(res.added))
          : res.message || t("sync_completed"),
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600">{t("an_error_occurred")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("notification_settings")}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("notification_settings_desc")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSync} disabled={syncMutation.isPending}>
            {syncMutation.isPending
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <RefreshCw className="mr-2 h-4 w-4" />}
            {t("sync")}
          </Button>
          <Button onClick={handleSave} disabled={!isDirty || updateMutation.isPending}>
            {updateMutation.isPending
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Save className="mr-2 h-4 w-4" />}
            {t("save")}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {settings.map((s) => (
          <div key={s.id}
            className="flex flex-col gap-4 rounded-xl border bg-white p-4 dark:bg-gray-900/20 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-start gap-3">
              <Switch
                checked={s.is_active}
                onCheckedChange={(val) => updateSetting(s.id, "is_active", val)}
              />
              <div>
                <p className="font-medium">{EVENT_TYPE_LABELS[s.event_type] ?? s.event_type}</p>
                <p className="text-xs font-mono text-gray-500">{s.event_type}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((ch) => {
                const active = s.channels.includes(ch);
                return (
                  <button key={ch} type="button" onClick={() => toggleChannel(s.id, ch)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-transparent text-gray-500 hover:border-gray-400"
                    }`}>
                    {CHANNEL_LABELS[ch]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {isDirty && (
        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="shadow-lg">
            {updateMutation.isPending
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Save className="mr-2 h-4 w-4" />}
            {t("save_changes")}
          </Button>
        </div>
      )}
    </div>
  );
}
