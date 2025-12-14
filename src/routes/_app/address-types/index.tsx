import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Edit as EditIcon, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Add from "./-popups/Add";
import Edit from "./-popups/Edit";
import { Button } from "@/components/ui/button";
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
import {
  useAddressTypes,
  useDeleteAddressType,
  useToggleAddressTypeStatus,
} from "@/lib/queries/address-types";
import { useTranslation } from "@/lib/utils/translationLoader";
import DeleteModal from "@/components/ui/delete-modal";

export const Route = createFileRoute("/_app/address-types/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({ page: 1 });
  const [modalState, setModalState] = useState<{
    type: "add" | "edit" | "delete" | null;
    data?: any;
  }>({ type: null });

  const { data, isLoading } = useAddressTypes(filters);
  const deleteAddressTypeMutation = useDeleteAddressType();
  const toggleStatusMutation = useToggleAddressTypeStatus();

  const addressTypes = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);

  const handleToggleStatus = async (addressType: any) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: addressType.id,
        isActive: addressType.is_active,
      });
      toast.success(t("status_updated_successfully"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_update_status"));
    }
  };

  const handleDelete = async () => {
    if (!modalState.data) return;
    try {
      await deleteAddressTypeMutation.mutateAsync(modalState.data.id);
      toast.success(t("address_type_deleted_successfully"));
      setModalState({ type: null });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_delete_address_type"));
    }
  };

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("address_types")}</h1>
        <Button onClick={() => setModalState({ type: "add" })}>
          <Plus className="mr-2 h-4 w-4" />
          {t("new_address_type")}
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>{t("title")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("created_by")}</TableHead>
            <TableHead>{t("created_date")}</TableHead>
            <TableHead>{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(6)].map((_, j) => (
                  <TableCell key={j}>
                    <div className="h-4 animate-pulse rounded bg-gray-200"></div>
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : addressTypes.length > 0 ? (
            addressTypes.map((type: any, index: number) => (
              <TableRow key={type.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium">{type.title}</TableCell>
                <TableCell>
                  <Switch
                    checked={type.is_active}
                    onCheckedChange={() => handleToggleStatus(type)}
                    disabled={toggleStatusMutation.isPending}
                  />
                </TableCell>
                <TableCell>{type.created_user}</TableCell>
                <TableCell>{type.created_date}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setModalState({ type: "edit", data: type })}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setModalState({ type: "delete", data: type })}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-gray-500">
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
        onPageChange={(page) => setFilters({ page })}
        onPageSizeChange={() => {}}
        disabled={isLoading}
      />
      <Modal
        isOpen={modalState.type === "add"}
        onClose={() => setModalState({ type: null })}
        title={t("new_address_type")}
        size="lg"
      >
        <Add onClose={() => setModalState({ type: null })} />
      </Modal>
      <Modal
        isOpen={modalState.type === "edit"}
        onClose={() => setModalState({ type: null })}
        title={t("edit_address_type")}
        size="lg"
      >
        {modalState.data && (
          <Edit addressTypeId={modalState.data.id} onClose={() => setModalState({ type: null })} />
        )}
      </Modal>
      <Modal
        isOpen={modalState.type === "delete"}
        onClose={() => setModalState({ type: null })}
        title={t("delete_address_type")}
        size="sm"
      >
        <DeleteModal
          closeModal={() => setModalState({ type: null })}
          handleDelete={handleDelete}
          pending={deleteAddressTypeMutation.isPending}
        />
      </Modal>
    </div>
  );
}
