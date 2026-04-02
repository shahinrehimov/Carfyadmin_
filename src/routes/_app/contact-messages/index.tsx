import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Show from "./-popups/Show";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import Pagination from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useContactMessages,
  useDeleteContactMessage,
  useMarkAsRead,
  type ContactMessage,
} from "@/lib/queries/contact-messages";
import { useTranslation } from "@/lib/utils/translationLoader";
import DeleteModal from "@/components/ui/delete-modal";

export const Route = createFileRoute("/_app/contact-messages/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<{
    page: number;
    search: string;
    is_read: string;
  }>({ page: 1, search: "", is_read: "" });
  const [modalState, setModalState] = useState<{
    type: "show" | "delete" | null;
    data?: ContactMessage;
  }>({ type: null });

  const { data, isLoading } = useContactMessages(filters);
  const deleteMutation = useDeleteContactMessage();
  const markAsReadMutation = useMarkAsRead();

  const messages = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleIsReadFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      is_read: value === "all" ? "" : value,
      page: 1,
    }));
  };

  const handleQuickMarkAsRead = async (message: ContactMessage) => {
    try {
      await markAsReadMutation.mutateAsync(message.id);
      toast.success(t("marked_as_read"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const handleDelete = async () => {
    if (!modalState.data) return;
    try {
      await deleteMutation.mutateAsync(modalState.data.id);
      toast.success(t("deleted_successfully"));
      setModalState({ type: null });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  const closeModal = () => setModalState({ type: null });

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{t("contact_messages")}</h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder={t("search")}
          value={filters.search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full max-w-sm"
        />
        <Select
          value={filters.is_read === "" ? "all" : filters.is_read}
          onValueChange={handleIsReadFilter}
          className="w-full sm:w-[180px]"
          options={[
            { value: "all", label: t("all") },
            { value: "0", label: t("unread") },
            { value: "1", label: t("read") },
          ]}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>{t("full_name")}</TableHead>
            <TableHead>{t("email")}</TableHead>
            <TableHead className="max-w-[300px]">{t("message")}</TableHead>
            <TableHead className="w-[100px]">{t("status")}</TableHead>
            <TableHead>{t("created_date")}</TableHead>
            <TableHead className="w-[100px]">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(7)].map((_, j) => (
                  <TableCell key={j}>
                    <div className="h-4 animate-pulse rounded bg-gray-200" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : messages.length > 0 ? (
            messages.map((msg, index) => (
              <TableRow
                key={msg.id}
                className={!msg.is_read ? "font-semibold" : ""}
              >
                <TableCell>
                  {(filters.page - 1) * perPage + index + 1}
                </TableCell>
                <TableCell>{msg.full_name}</TableCell>
                <TableCell>{msg.email}</TableCell>
                <TableCell className="max-w-[300px]">
                  <span className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                    {msg.message}
                  </span>
                </TableCell>
                <TableCell>
                  {msg.is_read ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {t("read")}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleQuickMarkAsRead(msg)}
                      disabled={markAsReadMutation.isPending}
                      className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
                    >
                      {t("unread")}
                    </button>
                  )}
                </TableCell>
                <TableCell>{msg.created_date}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setModalState({ type: "show", data: msg })
                      }
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setModalState({ type: "delete", data: msg })
                      }
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-12 text-center text-gray-500"
              >
                {t("no_data_found")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Pagination
        currentPage={filters.page}
        totalPages={totalPages}
        pageSize={perPage}
        totalItems={total}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        onPageSizeChange={() => {}}
        disabled={isLoading}
      />

      <Modal
        isOpen={modalState.type === "show"}
        onClose={closeModal}
        title={t("contact_message")}
        size="lg"
      >
        {modalState.data && (
          <Show messageId={modalState.data.id} onClose={closeModal} />
        )}
      </Modal>

      <Modal
        isOpen={modalState.type === "delete"}
        onClose={closeModal}
        title={t("delete_contact_message")}
        size="sm"
      >
        <DeleteModal
          closeModal={closeModal}
          handleDelete={handleDelete}
          pending={deleteMutation.isPending}
        />
      </Modal>
    </div>
  );
}
