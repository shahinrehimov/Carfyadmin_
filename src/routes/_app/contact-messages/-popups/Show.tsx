import { toast } from "sonner";
import { Mail, User, Calendar, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useContactMessage,
  useMarkAsRead,
  useMarkAsUnread,
} from "@/lib/queries/contact-messages";
import { useTranslation } from "@/lib/utils/translationLoader";

interface ShowProps {
  messageId: number;
  onClose: () => void;
}

export default function Show({ messageId, onClose }: ShowProps) {
  const { t } = useTranslation();
  const { data: message, isLoading } = useContactMessage(messageId);
  const markAsReadMutation = useMarkAsRead();
  const markAsUnreadMutation = useMarkAsUnread();

  const handleMarkAsRead = async () => {
    try {
      await markAsReadMutation.mutateAsync(messageId);
      toast.success(t("marked_as_read"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const handleMarkAsUnread = async () => {
    try {
      await markAsUnreadMutation.mutateAsync(messageId);
      toast.success(t("marked_as_unread"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-6 animate-pulse rounded bg-gray-200" />
        ))}
      </div>
    );
  }

  if (!message) return null;

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-start gap-3">
        <User className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        <div>
          <p className="text-xs text-gray-500">{t("full_name")}</p>
          <p className="font-medium">{message.full_name}</p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        <div>
          <p className="text-xs text-gray-500">{t("email")}</p>
          <p className="font-medium">{message.email}</p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        <div>
          <p className="text-xs text-gray-500">{t("created_date")}</p>
          <p className="font-medium">{message.created_date}</p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        <div className="flex-1">
          <p className="text-xs text-gray-500">{t("message")}</p>
          <p className="mt-1 whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-800">
            {message.message}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={onClose}>
          {t("close")}
        </Button>
        {message.is_read ? (
          <Button
            variant="outline"
            onClick={handleMarkAsUnread}
            disabled={markAsUnreadMutation.isPending}
          >
            {t("mark_as_unread")}
          </Button>
        ) : (
          <Button
            onClick={handleMarkAsRead}
            disabled={markAsReadMutation.isPending}
          >
            {t("mark_as_read")}
          </Button>
        )}
      </div>
    </div>
  );
}
