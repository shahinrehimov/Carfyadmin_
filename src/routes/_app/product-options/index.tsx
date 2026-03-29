import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Edit as EditIcon, Plus, Trash2, ArrowUp, ArrowDown, List } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  useProductOptions,
  useDeleteProductOption,
  useToggleProductOptionStatus,
  useChangeProductOptionSorting,
  type ProductOption,
} from "@/lib/queries/product-options";
import Add from "./-popups/Add";
import Edit from "./-popups/Edit";

export const Route = createFileRoute("/_app/product-options/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();

  const [filters, setFilters] = useState({ page: 1, search: "" });
  const [modalState, setModalState] = useState<{
    type: "add" | "edit" | "delete" | null;
    data?: ProductOption;
  }>({ type: null });

  const { data, isLoading } = useProductOptions(filters);
  const deleteMutation = useDeleteProductOption();
  const toggleStatusMutation = useToggleProductOptionStatus();
  const changeSortingMutation = useChangeProductOptionSorting();

  const items = data?.data || [];
  const total = data?.meta.total || 0;
  const perPage = data?.meta.per_page || 10;
  const totalPages = Math.ceil(total / perPage);

  const handleToggleStatus = async (item: ProductOption) => {
    try {
      await toggleStatusMutation.mutateAsync({ id: item.id });
      toast.success(t("status_updated_successfully"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_update_status"));
    }
  };

  const handleSortUp = async (item: ProductOption) => {
    try {
      await changeSortingMutation.mutateAsync({ id: item.id, sort: item.sort + 1 });
      toast.success(t("sort_updated_successfully"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_update_sort"));
    }
  };

  const handleSortDown = async (item: ProductOption) => {
    if (item.sort <= 0) return;
    try {
      await changeSortingMutation.mutateAsync({ id: item.id, sort: Math.max(0, item.sort - 1) });
      toast.success(t("sort_updated_successfully"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_to_update_sort"));
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

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("product_options")}</h1>
        <Button onClick={() => setModalState({ type: "add" })}>
          <Plus className="mr-2 h-4 w-4" />
          {t("new_product_option")}
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder={t("search")}
          className="max-w-sm"
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>{t("title")}</TableHead>
            <TableHead className="w-[100px]">{t("is_required")}</TableHead>
            <TableHead className="w-[100px]">{t("has_items")}</TableHead>
            <TableHead className="w-[100px]">{t("is_translatable")}</TableHead>
            <TableHead className="w-[100px]">{t("can_multiple")}</TableHead>
            <TableHead className="w-[120px]">{t("sort")}</TableHead>
            <TableHead className="w-[80px]">{t("status")}</TableHead>
            <TableHead>{t("created_by")}</TableHead>
            <TableHead>{t("created_date")}</TableHead>
            <TableHead className="w-[130px]">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(11)].map((_, j) => (
                  <TableCell key={j}>
                    <div className="h-4 animate-pulse rounded bg-gray-200" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : items.length > 0 ? (
            items.map((item: ProductOption, index: number) => (
              <TableRow key={item.id}>
                <TableCell>{(filters.page - 1) * perPage + index + 1}</TableCell>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${item.is_required ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                  >
                    {item.is_required ? t("yes") : t("no")}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${item.has_items ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
                  >
                    {item.has_items ? t("yes") : t("no")}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${item.is_translatable ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}
                  >
                    {item.is_translatable ? t("yes") : t("no")}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${item.can_multiple ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}`}
                  >
                    {item.can_multiple ? t("yes") : t("no")}
                  </span>
                </TableCell>
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
                  <div className="flex gap-1">
                    {item.has_items && (
                      <Link to="/product-options/$id" params={{ id: String(item.id) }}>
                        <Button variant="ghost" size="icon" title={t("items")}>
                          <List className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
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
              <TableCell colSpan={11} className="py-12 text-center text-gray-500">
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
        title={t("new_product_option")}
        size="lg"
      >
        <Add onClose={() => setModalState({ type: null })} />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={modalState.type === "edit"}
        onClose={() => setModalState({ type: null })}
        title={t("edit_product_option")}
        size="lg"
      >
        {modalState.data && (
          <Edit
            productOptionId={modalState.data.id}
            onClose={() => setModalState({ type: null })}
          />
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={modalState.type === "delete"}
        onClose={() => setModalState({ type: null })}
        title={t("delete_product_option")}
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
