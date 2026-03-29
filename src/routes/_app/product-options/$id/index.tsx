import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUp, ArrowDown, Edit as EditIcon, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import DeleteModal from "@/components/ui/delete-modal";
import { useTranslation } from "@/lib/utils/translationLoader";
import {
  useProductOption,
  useProductOptionItems,
  useDeleteProductOptionItem,
  useToggleProductOptionItemStatus,
  useChangeProductOptionItemSorting,
  type ProductOptionItem,
} from "@/lib/queries/product-options";
import Add from "./-popups/Add";
import Edit from "./-popups/Edit";

export const Route = createFileRoute("/_app/product-options/$id/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const productOptionId = Number(id);

  const [filters, setFilters] = useState({ page: 1 });
  const [modalState, setModalState] = useState<{
    type: "add" | "edit" | "delete" | null;
    data?: ProductOptionItem;
  }>({ type: null });

  const { data: productOption } = useProductOption(productOptionId);
  const { data, isLoading } = useProductOptionItems(productOptionId, filters);
  const deleteMutation = useDeleteProductOptionItem();
  const toggleStatusMutation = useToggleProductOptionItemStatus();
  const changeSortingMutation = useChangeProductOptionItemSorting();

  const items = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);

  const handleToggleStatus = async (item: ProductOptionItem) => {
    try {
      await toggleStatusMutation.mutateAsync({ productOptionId, id: item.id });
      toast.success(t("status_updated_successfully"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_update_status"));
    }
  };

  const handleSortUp = async (item: ProductOptionItem) => {
    try {
      await changeSortingMutation.mutateAsync({ productOptionId, id: item.id, sort: item.sort + 1 });
      toast.success(t("sort_updated_successfully"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_update_sort"));
    }
  };

  const handleSortDown = async (item: ProductOptionItem) => {
    if (item.sort <= 0) return;
    try {
      await changeSortingMutation.mutateAsync({
        productOptionId,
        id: item.id,
        sort: Math.max(0, item.sort - 1),
      });
      toast.success(t("sort_updated_successfully"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_update_sort"));
    }
  };

  const handleDelete = async () => {
    if (!modalState.data) return;
    try {
      await deleteMutation.mutateAsync({ productOptionId, id: modalState.data.id });
      toast.success(t("deleted_successfully"));
      setModalState({ type: null });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("an_error_occurred"));
    }
  };

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center gap-4">
        <Link to="/product-options">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{t("product_option_items")}</h1>
            {productOption?.title && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-sm font-medium text-muted-foreground">
                {productOption.title}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {t("total")}: {total}
        </span>
        <Button onClick={() => setModalState({ type: "add" })}>
          <Plus className="mr-2 h-4 w-4" />
          {t("add_item")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>{t("title")}</TableHead>
            <TableHead className="w-[120px]">{t("sort")}</TableHead>
            <TableHead className="w-[80px]">{t("status")}</TableHead>
            <TableHead>{t("created_by")}</TableHead>
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
          ) : items.length > 0 ? (
            items.map((item: ProductOptionItem, index: number) => (
              <TableRow key={item.id}>
                <TableCell>{(filters.page - 1) * perPage + index + 1}</TableCell>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="w-8 text-center text-sm">{item.sort}</span>
                    <div className="flex flex-col">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => handleSortUp(item)}
                        disabled={changeSortingMutation.isPending}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => handleSortDown(item)}
                        disabled={changeSortingMutation.isPending || item.sort <= 0}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={() => handleToggleStatus(item)}
                    disabled={toggleStatusMutation.isPending}
                  />
                </TableCell>
                <TableCell>{item.created_user}</TableCell>
                <TableCell>{item.created_date}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setModalState({ type: "edit", data: item })}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setModalState({ type: "delete", data: item })}
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
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        onPageSizeChange={() => {}}
        disabled={isLoading}
      />

      {/* Add Modal */}
      <Modal
        isOpen={modalState.type === "add"}
        onClose={() => setModalState({ type: null })}
        title={t("add_item")}
        size="lg"
      >
        <Add productOptionId={productOptionId} onClose={() => setModalState({ type: null })} />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={modalState.type === "edit"}
        onClose={() => setModalState({ type: null })}
        title={t("edit_item")}
        size="lg"
      >
        {modalState.data && (
          <Edit
            productOptionId={productOptionId}
            itemId={modalState.data.id}
            onClose={() => setModalState({ type: null })}
          />
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={modalState.type === "delete"}
        onClose={() => setModalState({ type: null })}
        title={t("delete_item")}
        size="sm"
      >
        <DeleteModal
          closeModal={() => setModalState({ type: null })}
          handleDelete={handleDelete}
          pending={deleteMutation.isPending}
        />
      </Modal>
    </div>
  );
}
