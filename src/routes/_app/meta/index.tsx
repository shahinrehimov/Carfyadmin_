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
import { useDeleteMeta, useMetaList } from "@/lib/queries/meta";
import { useTranslation } from "@/lib/utils/translationLoader";
import DeleteModal from "@/components/ui/delete-modal";

export const Route = createFileRoute("/_app/meta/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({ page: 1 });
  const [modalState, setModalState] = useState<{
    type: "add" | "edit" | "delete" | null;
    data?: any;
  }>({ type: null });

  const { data, isLoading } = useMetaList(filters);
  const deleteMetaMutation = useDeleteMeta();

  const metaList = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);

  const handleDelete = async () => {
    if (!modalState.data) return;
    try {
      await deleteMetaMutation.mutateAsync(modalState.data.id);
      toast.success(t("meta_deleted_successfully"));
      setModalState({ type: null });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_delete_meta"));
    }
  };

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("meta_tags")}</h1>
        <Button onClick={() => setModalState({ type: "add" })}>
          <Plus className="mr-2 h-4 w-4" />
          {t("new_meta")}
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>{t("key")}</TableHead>
            <TableHead>{t("title")}</TableHead>
            <TableHead>{t("description")}</TableHead>
            <TableHead>{t("created_by")}</TableHead>
            <TableHead>{t("created_date")}</TableHead>
            <TableHead>{t("actions")}</TableHead>
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
          ) : metaList.length > 0 ? (
            metaList.map((meta: any, index: number) => (
              <TableRow key={meta.id}>
                <TableCell>{(filters.page - 1) * perPage + index + 1}</TableCell>
                <TableCell>{meta.page_key}</TableCell>
                <TableCell className="max-w-xs truncate">{meta.page_title}</TableCell>
                <TableCell className="max-w-xs truncate">{meta.title}</TableCell>
                <TableCell>{meta.created_user}</TableCell>
                <TableCell>
                  {meta.created_date ? new Date(meta.created_date).toLocaleString() : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setModalState({ type: "edit", data: meta })}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setModalState({ type: "delete", data: meta })}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="py-12 text-center text-gray-500">
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
        title={t("new_meta")}
        size="lg"
      >
        <Add onClose={() => setModalState({ type: null })} />
      </Modal>
      <Modal
        isOpen={modalState.type === "edit"}
        onClose={() => setModalState({ type: null })}
        title={t("edit_meta")}
        size="lg"
      >
        {modalState.data && (
          <Edit metaId={modalState.data.id} onClose={() => setModalState({ type: null })} />
        )}
      </Modal>
      <Modal
        isOpen={modalState.type === "delete"}
        onClose={() => setModalState({ type: null })}
        title={t("delete_meta")}
        size="sm"
      >
        <DeleteModal
          closeModal={() => setModalState({ type: null })}
          handleDelete={handleDelete}
          pending={deleteMetaMutation.isPending}
        />
      </Modal>
    </div>
  );
}
