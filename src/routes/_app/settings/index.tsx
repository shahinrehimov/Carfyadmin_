import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Edit as EditIcon, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Add from "./-popups/Add";
import Edit from "./-popups/Edit";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import Pagination from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSettings, useDeleteSetting } from "@/lib/queries/settings";
import { useTranslation } from "@/lib/utils/translationLoader";
import DeleteModal from "@/components/ui/delete-modal";

export const Route = createFileRoute("/_app/settings/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({ page: 1 });
  const [modalState, setModalState] = useState<{
    type: "add" | "edit" | "delete" | null;
    data?: {
      key: string;
      type: string;
      value: string;
      created_user: string;
      created_date: string;
    };
  }>({ type: null });

  const { data, isLoading } = useSettings(filters);
  const deleteSettingMutation = useDeleteSetting();

  const settings = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);

  const handleDelete = async () => {
    if (!modalState.data) return;
    try {
      await deleteSettingMutation.mutateAsync(modalState.data.key);
      toast.success(t("setting_deleted_successfully"));
      setModalState({ type: null });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t("failed_to_delete_setting"),
      );
    }
  };

  const videoExtensions = ["mp4", "avi", "mov", "wmv", "flv", "webm"];
  const isVideo = (value: string) =>
    videoExtensions.includes(value.split(".").pop() || "");

  const DesktopView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">#</TableHead>
          <TableHead>{t("key")}</TableHead>
          <TableHead>{t("type")}</TableHead>
          <TableHead>{t("value")}</TableHead>
          <TableHead>{t("created_by")}</TableHead>
          <TableHead>{t("created_date")}</TableHead>
          <TableHead className="w-[120px]">{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <TableRow key={i}>
              {[...Array(7)].map((_, j) => (
                <TableCell key={j}>
                  <div className="h-4 animate-pulse rounded bg-gray-200"></div>
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : settings.length > 0 ? (
          settings.map((setting, index) => (
            <TableRow key={setting.key}>
              <TableCell>{(filters.page - 1) * perPage + index + 1}</TableCell>
              <TableCell className="font-medium">{setting.key}</TableCell>
              <TableCell>
                {setting.type}
                {setting.type === "file" && isVideo(setting.value) && (
                  <span className="ml-1 text-xs text-gray-500">(video)</span>
                )}
              </TableCell>
              <TableCell className="max-w-xs">
                {setting.type === "file" ? (
                  isVideo(setting.value) ? (
                    <video
                      src={setting.value}
                      className="h-20 w-20 cursor-pointer rounded object-cover"
                      onClick={() => window.open(setting.value, "_blank")}
                    />
                  ) : (
                    <img
                      src={setting.value}
                      alt={setting.key}
                      className="h-20 w-20 cursor-pointer rounded object-cover"
                      onClick={() => window.open(setting.value, "_blank")}
                    />
                  )
                ) : (
                  <span className="truncate">{setting.value}</span>
                )}
              </TableCell>
              <TableCell>{setting.created_user}</TableCell>
              <TableCell>
                {setting.created_date
                  ? new Date(setting.created_date).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "-"}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setModalState({ type: "edit", data: setting })
                    }
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setModalState({ type: "delete", data: setting })
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
            <TableCell colSpan={7}>
              <div className="py-12 text-center text-gray-500">
                {t("no_data_found")}
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{t("settings")}</h1>
        <Button
          onClick={() => setModalState({ type: "add" })}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("new_setting")}
        </Button>
      </div>
      <div className="overflow-hidden p-0">
        <DesktopView />
      </div>
      <Pagination
        currentPage={filters.page}
        totalPages={totalPages}
        pageSize={perPage}
        totalItems={total}
        onPageChange={(page) => setFilters({ page })}
        onPageSizeChange={() => {}}
        disabled={isLoading}
      />
      <Modal
        isOpen={modalState.type === "add"}
        onClose={() => setModalState({ type: null })}
        title={t("new_setting")}
        size="lg"
      >
        <Add onClose={() => setModalState({ type: null })} />
      </Modal>
      <Modal
        isOpen={modalState.type === "edit"}
        onClose={() => setModalState({ type: null })}
        title={t("edit_setting")}
        size="lg"
      >
        {modalState.data && (
          <Edit
            settingKey={modalState.data.key}
            onClose={() => setModalState({ type: null })}
          />
        )}
      </Modal>
      <Modal
        isOpen={modalState.type === "delete"}
        onClose={() => setModalState({ type: null })}
        title={t("delete_setting")}
        size="sm"
      >
        <DeleteModal
          closeModal={() => setModalState({ type: null })}
          handleDelete={handleDelete}
          pending={deleteSettingMutation.isPending}
        />
      </Modal>
    </div>
  );
}
