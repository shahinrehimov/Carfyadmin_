import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Edit as EditIcon, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@uidotdev/usehooks";
import Add from "./-popups/Add";
import Edit from "./-popups/Edit";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import Pagination from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSocials, useDeleteSocial, useToggleSocialStatus } from "@/lib/queries/socials";
import { useTranslation } from "@/lib/utils/translationLoader";
import DeleteModal from "@/components/ui/delete-modal";

export const Route = createFileRoute("/_app/socials/")({
  component: RouteComponent,
});

interface Social {
  id: number;
  key: string;
  link: string;
  is_active: boolean;
  created_user: string;
  created_date: string;
}

function RouteComponent() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [filters, setFilters] = useState({
    page: 1,
  });

  const [modalState, setModalState] = useState<{
    type: "add" | "edit" | "delete" | null;
    data?: Social;
  }>({ type: null });

  const { data, isLoading, error } = useSocials(filters);
  const deleteSocialMutation = useDeleteSocial();
  const toggleStatusMutation = useToggleSocialStatus();

  const socials = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleToggleStatus = async (social: Social) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: social.id,
        isActive: social.is_active,
      });
      toast.success(t("status_updated_successfully"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_update_status"));
    }
  };

  const handleDelete = async () => {
    if (!modalState.data) return;

    try {
      await deleteSocialMutation.mutateAsync(modalState.data.id);
      toast.success(t("social_deleted_successfully"));
      setModalState({ type: null });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_delete_social"));
    }
  };

  const closeModal = () => {
    setModalState({ type: null });
  };

  const NoData = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <p className="text-lg text-gray-500">{t("no_data_found")}</p>
    </div>
  );

  const DesktopView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">#</TableHead>
          <TableHead>{t("key")}</TableHead>
          <TableHead>{t("link")}</TableHead>
          <TableHead className="w-[100px]">{t("status")}</TableHead>
          <TableHead>{t("created_by")}</TableHead>
          <TableHead>{t("created_date")}</TableHead>
          <TableHead className="w-[120px]">{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          [...Array(5)].map((_, index) => (
            <TableRow key={index}>
              {[...Array(7)].map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <div className="h-4 animate-pulse rounded bg-gray-200"></div>
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : socials.length > 0 ? (
          socials.map((social, index) => (
            <TableRow key={social.id}>
              <TableCell>{filters.page * perPage - perPage + index + 1}</TableCell>
              <TableCell className="font-medium">{social.key}</TableCell>
              <TableCell className="max-w-xs truncate text-gray-600">
                <a
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {social.link}
                </a>
              </TableCell>
              <TableCell>
                <Switch
                  checked={social.is_active}
                  onCheckedChange={() => handleToggleStatus(social)}
                  disabled={toggleStatusMutation.isPending}
                />
              </TableCell>
              <TableCell>{social.created_user}</TableCell>
              <TableCell>{social.created_date}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setModalState({ type: "edit", data: social })}
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setModalState({ type: "delete", data: social })}
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
              <NoData />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  const MobileView = () => (
    <div className="space-y-4">
      {isLoading ? (
        [...Array(5)].map((_, index) => (
          <div key={index} className="animate-pulse border-b p-4">
            <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="h-3 w-1/2 rounded bg-gray-200"></div>
          </div>
        ))
      ) : socials.length > 0 ? (
        socials.map((social, index) => (
          <Card key={social.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium">
                  {filters.page * perPage - perPage + index + 1}. {social.key}
                </h3>
                <p className="mt-1 truncate text-sm text-gray-600">{social.link}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Switch
                checked={social.is_active}
                onCheckedChange={() => handleToggleStatus(social)}
                disabled={toggleStatusMutation.isPending}
              />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setModalState({ type: "edit", data: social })}
                >
                  <EditIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setModalState({ type: "delete", data: social })}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          </Card>
        ))
      ) : (
        <NoData />
      )}
    </div>
  );

  if (error) {
    return (
      <div className="p-6">
        <div className="py-12 text-center">
          <p className="text-red-600">{t("error_loading_socials")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{t("socials")}</h1>
        <Button onClick={() => setModalState({ type: "add" })} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t("new_social")}
        </Button>
      </div>

      <div className="overflow-hidden p-0">{isMobile ? <MobileView /> : <DesktopView />}</div>

      <Pagination
        currentPage={filters.page}
        totalPages={totalPages}
        pageSize={perPage}
        totalItems={total}
        onPageChange={handlePageChange}
        onPageSizeChange={() => {}}
        disabled={isLoading}
      />

      <Modal
        isOpen={modalState.type === "add"}
        onClose={closeModal}
        title={t("new_social")}
        size="lg"
      >
        <Add onClose={closeModal} />
      </Modal>

      <Modal
        isOpen={modalState.type === "edit"}
        onClose={closeModal}
        title={t("edit_social")}
        size="lg"
      >
        {modalState.data && <Edit socialId={modalState.data.id} onClose={closeModal} />}
      </Modal>

      <Modal
        isOpen={modalState.type === "delete"}
        onClose={closeModal}
        title={t("delete_social")}
        size="sm"
      >
        <DeleteModal
          closeModal={closeModal}
          handleDelete={handleDelete}
          pending={deleteSocialMutation.isPending}
        />
      </Modal>
    </div>
  );
}
